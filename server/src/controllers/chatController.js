import Conversation from '../models/Conversation.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { chatWithLearningAssistant } from '../services/geminiService.js';

/**
 * @desc    Send a message to the AI Learning Assistant
 * @route   POST /api/chat/message
 * @access  Private (Student, Teacher, Admin)
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId, subjectId, topicId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question or topic to discuss with the AI Assistant',
      });
    }

    const trimmedMessage = message.trim();
    let conversation;

    // 1. Find or initialize conversation
    if (conversationId && conversationId !== 'new') {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
        });
      }

      // Update subject/topic context if explicitly passed
      if (subjectId !== undefined) conversation.subject = subjectId || null;
      if (topicId !== undefined) conversation.topic = topicId || null;
    } else {
      // Auto-generate title from first message
      let generatedTitle = trimmedMessage.slice(0, 48);
      if (trimmedMessage.length > 48) {
        const lastSpace = generatedTitle.lastIndexOf(' ');
        if (lastSpace > 20) {
          generatedTitle = generatedTitle.substring(0, lastSpace);
        }
        generatedTitle += '...';
      }

      conversation = new Conversation({
        user: req.user._id,
        title: generatedTitle || 'Academic Discussion',
        subject: subjectId || null,
        topic: topicId || null,
        messages: [],
      });
    }

    // 2. Fetch contextual Subject and Topic details if present
    let subjectDoc = null;
    let topicDoc = null;

    if (conversation.subject) {
      subjectDoc = await Subject.findById(conversation.subject).select('title code category');
    }
    if (conversation.topic) {
      topicDoc = await Topic.findById(conversation.topic).select('title description');
    }

    // 3. Call Gemini AI Service with multi-turn history & syllabus context
    const aiResult = await chatWithLearningAssistant({
      message: trimmedMessage,
      history: conversation.messages,
      subject: subjectDoc,
      topic: topicDoc,
    });

    const contextUsed = {
      subjectTitle: subjectDoc ? subjectDoc.title : '',
      topicTitle: topicDoc ? topicDoc.title : '',
    };

    // 4. Append user message & assistant reply
    conversation.messages.push({
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: 'model',
      content: aiResult.reply,
      suggestedFollowUps: aiResult.suggestedFollowUps || [],
      contextUsed,
      timestamp: new Date(),
    });

    await conversation.save();

    // Populate references for client response
    await conversation.populate([
      { path: 'subject', select: 'title code category' },
      { path: 'topic', select: 'title description' },
    ]);

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        title: conversation.title,
        subject: conversation.subject,
        topic: conversation.topic,
        pinned: conversation.pinned,
        reply: aiResult.reply,
        suggestedFollowUps: aiResult.suggestedFollowUps || [],
        messages: conversation.messages,
        aiModel: aiResult.aiModel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's conversations list
 * @route   GET /api/chat/conversations
 * @access  Private
 */
export const getConversations = async (req, res, next) => {
  try {
    const { subjectId, search } = req.query;

    const query = { user: req.user._id };

    if (subjectId) {
      query.subject = subjectId;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const conversations = await Conversation.find(query)
      .select('title subject topic pinned createdAt updatedAt messages')
      .populate('subject', 'title code')
      .populate('topic', 'title')
      .sort({ pinned: -1, updatedAt: -1 })
      .lean();

    // Add message count and last message preview
    const formatted = conversations.map((conv) => {
      const lastMsg = conv.messages && conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1]
        : null;

      return {
        _id: conv._id,
        title: conv.title,
        subject: conv.subject,
        topic: conv.topic,
        pinned: conv.pinned,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages ? conv.messages.length : 0,
        lastMessagePreview: lastMsg ? lastMsg.content.slice(0, 90) : '',
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single conversation by ID with full messages
 * @route   GET /api/chat/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('subject', 'title code category')
      .populate('topic', 'title description');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update conversation (title, pinned, subject, topic)
 * @route   PATCH /api/chat/conversations/:id
 * @access  Private
 */
export const updateConversation = async (req, res, next) => {
  try {
    const { title, pinned, subjectId, topicId } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (title !== undefined) conversation.title = title.trim();
    if (pinned !== undefined) conversation.pinned = Boolean(pinned);
    if (subjectId !== undefined) conversation.subject = subjectId || null;
    if (topicId !== undefined) conversation.topic = topicId || null;

    await conversation.save();

    await conversation.populate([
      { path: 'subject', select: 'title code category' },
      { path: 'topic', select: 'title description' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Conversation updated successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a conversation
 * @route   DELETE /api/chat/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all conversations for current user
 * @route   DELETE /api/chat/conversations
 * @access  Private
 */
export const clearConversations = async (req, res, next) => {
  try {
    const result = await Conversation.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} conversations`,
    });
  } catch (error) {
    next(error);
  }
};
