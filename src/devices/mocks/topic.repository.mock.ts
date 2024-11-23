import { Topic } from '../entities/topic.entity';

export class TopicRepositoryMock {
  static build() {
    return {
      remove: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((topicName) => {
        const topic = new Topic();
        topic.name = topicName;
        return topic;
      }),
      save: jest.fn().mockResolvedValue(null),
    };
  }
}
