import Summary from '../models/Summary.js';
import Note from '../models/Note.js';
import Material from '../models/Material.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { summarizeAcademicContent } from '../services/geminiService.js';

/**
 * @desc    Generate an AI summary from a note, study material, or custom text
 * @route   POST /api/summaries/generate
 * @access  Private (Student, Teacher, Admin)
 */
export const generateSummary = async (req, res, next) => {
  try {
    const {
      sourceType = 'custom',
      noteId,
      materialId,
      title,
      content,
      subjectId,
      topicId,
      focusMode = 'balanced',
      autoSave = false,
    } = req.body;

    let targetTitle = title || 'Academic Study Material';
    let targetContent = content || '';
    let targetSubjectId = subjectId || null;
    let targetTopicId = topicId || null;
    let resolvedNote = null;
    let resolvedMaterial = null;

    // 1. Resolve source content based on sourceType
    if (sourceType === 'note') {
      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a noteId to summarize from your notes',
        });
      }

      resolvedNote = await Note.findOne({
        _id: noteId,
        user: req.user._id,
      });

      if (!resolvedNote) {
        return res.status(404).json({
          success: false,
          message: 'Note not found or access denied',
        });
      }

      targetTitle = resolvedNote.title;
      targetContent = resolvedNote.content;
      targetSubjectId = resolvedNote.subject;
      targetTopicId = resolvedNote.topic;
    } else if (sourceType === 'material') {
      if (!materialId) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a materialId to summarize courseware',
        });
      }

      resolvedMaterial = await Material.findById(materialId);
      if (!resolvedMaterial) {
        return res.status(404).json({
          success: false,
          message: 'Study material not found',
        });
      }

      // Check access: must be public or uploaded by user or user is enrolled/teacher/admin
      if (!resolvedMaterial.isPublic && req.user.role === 'student') {
        const isEnrolled = req.user.enrolledSubjects?.some(
          (s) => s.toString() === resolvedMaterial.subject.toString()
        );
        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'You are not enrolled in the course offering this private material',
          });
        }
      }

      targetTitle = resolvedMaterial.title;
      targetSubjectId = resolvedMaterial.subject;
      targetTopicId = resolvedMaterial.topic;

      // Use AI extracted text, or fallback to description & metadata
      targetContent = resolvedMaterial.aiExtractedText && resolvedMaterial.aiExtractedText.trim()
        ? resolvedMaterial.aiExtractedText
        : `${resolvedMaterial.title}\n\n${resolvedMaterial.description || 'Course study material file: ' + resolvedMaterial.fileName}`;
    }

    if (!targetContent || !targetContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'The selected source has no readable content to summarize',
      });
    }

    // 2. Fetch subject and topic documents for syllabus context
    let subjectDoc = null;
    let topicDoc = null;
    if (targetSubjectId) {
      subjectDoc = await Subject.findById(targetSubjectId).select('title code category');
    }
    if (targetTopicId) {
      topicDoc = await Topic.findById(targetTopicId).select('title description');
    }

    // 3. Call Gemini AI Summarization Service
    const aiResult = await summarizeAcademicContent({
      title: targetTitle,
      content: targetContent,
      subject: subjectDoc,
      topic: topicDoc,
      focusMode,
    });

    const originalContentSnippet = targetContent.slice(0, 300).trim();

    let savedSummaryDoc = null;

    // 4. Optionally auto-save
    if (autoSave) {
      savedSummaryDoc = new Summary({
        user: req.user._id,
        title: targetTitle,
        sourceType,
        note: resolvedNote ? resolvedNote._id : null,
        material: resolvedMaterial ? resolvedMaterial._id : null,
        subject: targetSubjectId,
        topic: targetTopicId,
        originalContentSnippet,
        shortSummary: aiResult.shortSummary,
        detailedSummary: aiResult.detailedSummary,
        keyPoints: aiResult.keyPoints,
        importantTerms: aiResult.importantTerms,
        revisionNotes: aiResult.revisionNotes,
        focusMode,
        isSaved: true,
        aiModel: aiResult.aiModel,
      });

      await savedSummaryDoc.save();

      // Update note aiMetadata if note was summarized
      if (resolvedNote) {
        resolvedNote.aiMetadata = {
          ...resolvedNote.aiMetadata,
          summary: aiResult.shortSummary,
          keyConcepts: aiResult.keyPoints,
        };
        await resolvedNote.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        summaryId: savedSummaryDoc ? savedSummaryDoc._id : null,
        title: targetTitle,
        sourceType,
        noteId: resolvedNote ? resolvedNote._id : null,
        materialId: resolvedMaterial ? resolvedMaterial._id : null,
        subject: subjectDoc,
        topic: topicDoc,
        originalContentSnippet,
        shortSummary: aiResult.shortSummary,
        detailedSummary: aiResult.detailedSummary,
        keyPoints: aiResult.keyPoints,
        importantTerms: aiResult.importantTerms,
        revisionNotes: aiResult.revisionNotes,
        focusMode,
        aiModel: aiResult.aiModel,
        isSaved: Boolean(savedSummaryDoc),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save a generated summary to the user's summaries library
 * @route   POST /api/summaries
 * @access  Private
 */
export const saveSummary = async (req, res, next) => {
  try {
    const {
      title,
      sourceType = 'custom',
      noteId,
      materialId,
      subjectId,
      topicId,
      shortSummary,
      detailedSummary,
      keyPoints = [],
      importantTerms = [],
      revisionNotes = [],
      focusMode = 'balanced',
      originalContentSnippet = '',
      aiModel = 'gemini-1.5-flash',
    } = req.body;

    if (!title || !shortSummary || !detailedSummary) {
      return res.status(400).json({
        success: false,
        message: 'Title, short summary, and detailed summary are required to save',
      });
    }

    const summary = new Summary({
      user: req.user._id,
      title: title.trim(),
      sourceType,
      note: noteId || null,
      material: materialId || null,
      subject: subjectId || null,
      topic: topicId || null,
      originalContentSnippet: originalContentSnippet.slice(0, 500),
      shortSummary,
      detailedSummary,
      keyPoints,
      importantTerms,
      revisionNotes,
      focusMode,
      isSaved: true,
      aiModel,
    });

    await summary.save();

    // If linked to a personal note, sync summary into note aiMetadata
    if (noteId) {
      await Note.findOneAndUpdate(
        { _id: noteId, user: req.user._id },
        {
          $set: {
            'aiMetadata.summary': shortSummary,
            'aiMetadata.keyConcepts': keyPoints,
          },
        }
      );
    }

    await summary.populate([
      { path: 'subject', select: 'title code' },
      { path: 'topic', select: 'title' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Summary saved to your study library',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's saved summaries list with filters
 * @route   GET /api/summaries
 * @access  Private
 */
export const getSummaries = async (req, res, next) => {
  try {
    const { subjectId, sourceType, search } = req.query;

    const query = { user: req.user._id, isSaved: true };

    if (subjectId) {
      query.subject = subjectId;
    }

    if (sourceType) {
      query.sourceType = sourceType;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const summaries = await Summary.find(query)
      .select('title sourceType subject topic originalContentSnippet shortSummary keyPoints focusMode createdAt updatedAt')
      .populate('subject', 'title code')
      .populate('topic', 'title')
      .populate('note', 'title')
      .populate('material', 'title fileType')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: summaries.length,
      data: summaries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single summary by ID with full details
 * @route   GET /api/summaries/:id
 * @access  Private
 */
export const getSummaryById = async (req, res, next) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('subject', 'title code category')
      .populate('topic', 'title description')
      .populate('note', 'title content')
      .populate('material', 'title fileType fileUrl fileName');

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved summary
 * @route   DELETE /api/summaries/:id
 * @access  Private
 */
export const deleteSummary = async (req, res, next) => {
  try {
    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Summary deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export an AI summary into a new Note
 * @route   POST /api/summaries/:id/export-to-note
 * @access  Private
 */
export const exportSummaryToNote = async (req, res, next) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    // Compose formatted markdown note content
    let noteContent = `## Executive Summary\n${summary.shortSummary}\n\n## Detailed Synthesis\n${summary.detailedSummary}\n\n`;

    if (summary.keyPoints && summary.keyPoints.length > 0) {
      noteContent += `## Key Takeaways\n${summary.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
    }

    if (summary.importantTerms && summary.importantTerms.length > 0) {
      noteContent += `## Important Academic Terms\n${summary.importantTerms
        .map((t) => `- **${t.term}**: ${t.definition}`)
        .join('\n')}\n\n`;
    }

    if (summary.revisionNotes && summary.revisionNotes.length > 0) {
      noteContent += `## Active Recall & Revision Questions\n${summary.revisionNotes
        .map((r, i) => `${i + 1}. **Q:** ${r.question}\n   **A:** ${r.answer}${r.tip ? `\n   💡 *Tip: ${r.tip}*` : ''}`)
        .join('\n\n')}\n`;
    }

    const newNote = new Note({
      user: req.user._id,
      title: `AI Summary: ${summary.title}`,
      content: noteContent,
      subject: summary.subject || null,
      topic: summary.topic || null,
      material: summary.material || null,
      tags: ['ai-summary', 'exam-revision'],
      color: '#E7C6FF', // Soft Pastel Mauve
      aiMetadata: {
        summary: summary.shortSummary,
        keyConcepts: summary.keyPoints,
        flashcardsCount: summary.revisionNotes ? summary.revisionNotes.length : 0,
      },
    });

    await newNote.save();

    res.status(201).json({
      success: true,
      message: 'Summary successfully exported to My Notes',
      data: {
        noteId: newNote._id,
        title: newNote.title,
      },
    });
  } catch (error) {
    next(error);
  }
};
