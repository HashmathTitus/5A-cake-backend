import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';

export const recalculateEventStats = async (eventId) => {
  if (!eventId) {
    return null;
  }

  const normalizedEventId = eventId._id || eventId;
  const publishedFeedback = await Feedback.find({
    eventId: normalizedEventId,
    status: 'published',
  }).select('rating');

  const feedbackCount = publishedFeedback.length;
  const averageRating = feedbackCount > 0
    ? Number((publishedFeedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedbackCount).toFixed(1))
    : 0;

  return Event.findByIdAndUpdate(
    normalizedEventId,
    {
      feedbackCount,
      averageRating,
    },
    { new: true }
  );
};

export default recalculateEventStats;
