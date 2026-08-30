import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Material from '../models/Material.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import { determineFileType } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import notificationService from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Get all study materials with search, filter, and pagination
 * @route   GET /api/materials
 * @access  Private (Student, Teacher, Admin)
 */
export const getMaterials = async (req, res, next) => {
  try {
    const {
      subject,
      topic,
      fileType,
      uploadedBy,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    // Filter by Subject
    if (subject) {
      query.subject = subject;
    }

    // Filter by Topic
    if (topic) {
      query.topic = topic;
    }

    // Filter by File Type
    if (fileType) {
      query.fileType = fileType;
    }

    // Filter by Uploader
    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    // Keyword Search across title, description, and tags
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Material.countDocuments(query);

    const materials = await Material.find(query)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order difficulty')
      .populate('uploadedBy', 'name email role avatar institution')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: materials.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single material by ID
 * @route   GET /api/materials/:id
 * @access  Private
 */
export const getMaterialById = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('subject', 'title code category color teacher')
      .populate('topic', 'title order difficulty estimatedHours')
      .populate('uploadedBy', 'name email role avatar institution');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: `Study material with ID ${req.params.id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create / Upload new study material
 * @route   POST /api/materials
 * @access  Private (Teacher, Admin)
 */
export const createMaterial = async (req, res, next) => {
  try {
    // 1. Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid study material file (PDF, Word, PPT, Text, or Image).',
      });
    }

    const { title, description, subject: subjectId, topic: topicId, tags, isPublic } = req.body;

    // 2. Validate required subject
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject assignment is required for study materials.',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'The selected subject does not exist.',
      });
    }

    // 3. Authorization check: If user is teacher, ensure they are assigned or have permission
    if (req.user.role === 'teacher') {
      const isAssignedTeacher =
        subject.teacher && subject.teacher.toString() === req.user._id.toString();
      const isCreator =
        subject.createdBy && subject.createdBy.toString() === req.user._id.toString();

      if (!isAssignedTeacher && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only upload materials to subjects you teach.',
        });
      }
    }

    // 4. Validate topic if provided
    let verifiedTopicId = null;
    if (topicId && topicId.trim() !== '') {
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'The selected topic does not exist.',
        });
      }
      if (topic.subject.toString() !== subjectId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Selected topic does not belong to the chosen subject.',
        });
      }
      verifiedTopicId = topic._id;
    }

    // 5. Parse tags
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    // 6. Upload file to Cloudinary
    let fileUrl = `/uploads/materials/${req.file.filename}`;
    let cloudinaryPublicId = '';
    const detectedType = determineFileType(req.file.originalname, req.file.mimetype);

    try {
      if (detectedType === 'image') {
        const cRes = await uploadToCloudinary(req.file.path, {
          folder: 'studygenie/materials',
          resource_type: 'image',
        });
        if (cRes && cRes.url) {
          fileUrl = cRes.url;
          cloudinaryPublicId = cRes.publicId;
        }
      } else {
        const cRes = await uploadToCloudinary(req.file.path, {
          folder: 'studygenie/materials',
          resource_type: 'raw',
        });
        if (cRes && cRes.url) {
          cloudinaryPublicId = cRes.publicId;
          const verify = await fetch(cRes.url);
          if (verify.ok) {
            fileUrl = cRes.url;
          }
        }
      }
    } catch (cErr) {
      console.warn('Cloudinary upload warning (using local file fallback):', cErr.message);
    }

    // 7. Create Material in DB
    const material = await Material.create({
      title: title?.trim() || req.file.originalname,
      description: description?.trim() || '',
      fileUrl,
      fileName: req.file.originalname,
      cloudinaryPublicId,
      fileType: detectedType,
      fileSize: req.file.size,
      subject: subject._id,
      topic: verifiedTopicId,
      uploadedBy: req.user._id,
      tags: parsedTags,
      isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : true,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('uploadedBy', 'name email role avatar');

    // Automatically trigger notification to all enrolled students if public
    if (populatedMaterial.isPublic) {
      try {
        await notificationService.notifyEnrolledStudents(material.subject, {
          sender: req.user._id,
          type: 'material_uploaded',
          title: `New Material: ${populatedMaterial.title}`,
          message: `${req.user.name} uploaded new course material "${populatedMaterial.title}" (${populatedMaterial.fileType.toUpperCase()}).`,
          category: 'academic',
          priority: 'normal',
          link: `/materials/${populatedMaterial._id}`,
          relatedEntity: {
            entityId: populatedMaterial._id,
            entityType: 'Material',
          },
          metadata: {
            fileType: populatedMaterial.fileType,
            fileName: populatedMaterial.fileName,
            subjectTitle: populatedMaterial.subject?.title,
            subjectCode: populatedMaterial.subject?.code,
          },
        });
      } catch (notifErr) {
        console.error('Notification error on material upload:', notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Study material uploaded and published successfully!',
      data: populatedMaterial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update study material details
 * @route   PUT /api/materials/:id
 * @access  Private (Teacher, Admin)
 */
export const updateMaterial = async (req, res, next) => {
  try {
    let material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: `Study material with ID ${req.params.id} not found`,
      });
    }

    // Permission check: only uploader teacher or admin can modify
    const isOwner = material.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit materials you uploaded.',
      });
    }

    const { title, description, subject: subjectId, topic: topicId, tags, isPublic } = req.body;

    if (title) material.title = title.trim();
    if (description !== undefined) material.description = description.trim();
    if (isPublic !== undefined) {
      material.isPublic = isPublic === 'true' || isPublic === true;
    }

    // Update tags if provided
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        material.tags = tags;
      } else if (typeof tags === 'string') {
        material.tags = tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    // Optional topic update
    if (topicId !== undefined) {
      if (!topicId || topicId === 'null' || topicId === '') {
        material.topic = null;
      } else {
        const topic = await Topic.findById(topicId);
        if (topic) {
          material.topic = topic._id;
        }
      }
    }

    // If new file attached in update request
    if (req.file) {
      // Remove old file from Cloudinary if exists
      if (material.cloudinaryPublicId) {
        await deleteFromCloudinary(material.cloudinaryPublicId, material.fileType === 'image' ? 'image' : 'raw');
      }

      // Remove old file from disk if exists
      const oldFilePath = path.resolve(__dirname, '../../uploads/materials', path.basename(material.fileUrl));
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (unlinkErr) {
          console.error('Error removing old file on replacement:', unlinkErr.message);
        }
      }

      material.fileName = req.file.originalname;
      material.fileType = determineFileType(req.file.originalname, req.file.mimetype);
      material.fileSize = req.file.size;

      // Upload to Cloudinary
      try {
        const isImage = material.fileType === 'image';
        const cRes = await uploadToCloudinary(req.file.path, {
          folder: 'studygenie/materials',
          resource_type: isImage ? 'image' : 'raw',
        });
        if (cRes && cRes.url) {
          material.fileUrl = cRes.url;
          material.cloudinaryPublicId = cRes.publicId;
        } else {
          material.fileUrl = `/uploads/materials/${req.file.filename}`;
        }
      } catch (cErr) {
        material.fileUrl = `/uploads/materials/${req.file.filename}`;
      }
    }

    await material.save();

    const updated = await Material.findById(material._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('uploadedBy', 'name email role avatar');

    return res.status(200).json({
      success: true,
      message: 'Study material updated successfully!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete study material
 * @route   DELETE /api/materials/:id
 * @access  Private (Teacher, Admin)
 */
export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: `Study material with ID ${req.params.id} not found`,
      });
    }

    // Check ownership or admin
    const isOwner = material.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete materials you uploaded.',
      });
    }

    // Delete from Cloudinary if hosted on Cloudinary
    if (material.cloudinaryPublicId) {
      await deleteFromCloudinary(material.cloudinaryPublicId, material.fileType === 'image' ? 'image' : 'raw');
    }

    // Unlink file from disk
    const diskPath = path.resolve(__dirname, '../../uploads/materials', path.basename(material.fileUrl));
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.error('Could not delete physical file:', err.message);
      }
    }

    // Clear reference from any notes that linked to this material
    await Note.updateMany({ material: material._id }, { $set: { material: null } });

    // Delete record
    await Material.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Study material and file removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download material file & increment download counter
 * @route   GET /api/materials/:id/download
 * @access  Private
 */
export const downloadMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.',
      });
    }

    // Increment download counter
    material.downloadCount = (material.downloadCount || 0) + 1;
    await material.save();

    // If file is hosted on Cloudinary, stream it directly with attachment headers
    if (material.fileUrl.startsWith('http://') || material.fileUrl.startsWith('https://')) {
      try {
        const cloudResponse = await fetch(material.fileUrl);
        if (cloudResponse.ok) {
          const contentType = cloudResponse.headers.get('content-type') || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(material.fileName || 'study_material')}"`
          );
          const buffer = await cloudResponse.arrayBuffer();
          return res.send(Buffer.from(buffer));
        }
      } catch (streamErr) {
        console.warn('Direct stream from Cloudinary failed, attempting redirect:', streamErr.message);
        return res.redirect(material.fileUrl);
      }
    }

    // Resolve physical path on disk for local storage fallback
    const filePath = path.resolve(
      __dirname,
      '../../uploads/materials',
      path.basename(material.fileUrl)
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server.',
      });
    }

    // Stream download to browser with original filename
    return res.download(filePath, material.fileName || path.basename(filePath));
  } catch (error) {
    next(error);
  }
};
