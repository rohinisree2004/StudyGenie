import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Material from '../models/Material.js';

/**
 * @desc    Get all personal notes for current user with filtering and search
 * @route   GET /api/notes
 * @access  Private
 */
export const getNotes = async (req, res, next) => {
  try {
    const { subject, topic, material, isPinned, tag, search, sort = '-updatedAt' } = req.query;

    // Strict privacy boundary: notes are strictly owned by current user
    const query = { user: req.user._id };

    if (subject) {
      query.subject = subject;
    }

    if (topic) {
      query.topic = topic;
    }

    if (material) {
      query.material = material;
    }

    if (isPinned !== undefined) {
      query.isPinned = isPinned === 'true';
    }

    if (tag && tag.trim()) {
      query.tags = { $in: [new RegExp(tag.trim(), 'i')] };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const notes = await Note.find(query)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('material', 'title fileType fileUrl')
      .sort({ isPinned: -1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Private
 */
export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('material', 'title fileType fileUrl fileName');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new personal study note
 * @route   POST /api/notes
 * @access  Private
 */
export const createNote = async (req, res, next) => {
  try {
    const { title, content, subject, topic, material, tags, color, isPinned } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a note title.',
      });
    }

    // Validate subject if provided
    let verifiedSubjectId = null;
    if (subject && subject.trim() !== '') {
      const subjectDoc = await Subject.findById(subject);
      if (subjectDoc) {
        verifiedSubjectId = subjectDoc._id;
      }
    }

    // Validate topic if provided
    let verifiedTopicId = null;
    if (topic && topic.trim() !== '') {
      const topicDoc = await Topic.findById(topic);
      if (topicDoc) {
        verifiedTopicId = topicDoc._id;
      }
    }

    // Validate material if provided
    let verifiedMaterialId = null;
    if (material && material.trim() !== '') {
      const materialDoc = await Material.findById(material);
      if (materialDoc) {
        verifiedMaterialId = materialDoc._id;
      }
    }

    // Parse tags
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

    // Allowed soft pastel accents
    const allowedColors = ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'];
    const noteColor = allowedColors.includes(color) ? color : '#E7C6FF';

    const note = await Note.create({
      title: title.trim(),
      content: content || '',
      user: req.user._id,
      subject: verifiedSubjectId,
      topic: verifiedTopicId,
      material: verifiedMaterialId,
      tags: parsedTags,
      color: noteColor,
      isPinned: isPinned === true || isPinned === 'true',
    });

    const populated = await Note.findById(note._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('material', 'title fileType fileUrl');

    return res.status(201).json({
      success: true,
      message: 'Note created successfully!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing note
 * @route   PUT /api/notes/:id
 * @access  Private
 */
export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access unauthorized.',
      });
    }

    const { title, content, subject, topic, material, tags, color, isPinned } = req.body;

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;

    if (subject !== undefined) {
      note.subject = subject && subject !== '' ? subject : null;
    }

    if (topic !== undefined) {
      note.topic = topic && topic !== '' ? topic : null;
    }

    if (material !== undefined) {
      note.material = material && material !== '' ? material : null;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        note.tags = tags;
      } else if (typeof tags === 'string') {
        note.tags = tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    const allowedColors = ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'];
    if (color && allowedColors.includes(color)) {
      note.color = color;
    }

    if (isPinned !== undefined) {
      note.isPinned = isPinned === true || isPinned === 'true';
    }

    await note.save();

    const updated = await Note.findById(note._id)
      .populate('subject', 'title code category color')
      .populate('topic', 'title order')
      .populate('material', 'title fileType fileUrl');

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle pinned status of a note
 * @route   PATCH /api/notes/:id/pin
 * @access  Private
 */
export const togglePinNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    return res.status(200).json({
      success: true,
      message: note.isPinned ? 'Note pinned to top 📌' : 'Note unpinned',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a personal note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
