const { connectToMongo } = require('./mongo');
const { normalizeText } = require('../services/retrievalService');

/**
 * Seed FAQ data from the provided FAQ.md into MongoDB
 * This script populates the golden_answers collection
 */
async function seedFAQData() {
  try {
    const db = await connectToMongo();
    console.log('Seeding FAQ data...\n');

    const faqData = [
      {
        question: 'What is the latest internship Program?',
        answer:
          'VLED is running multiple cohorts of virtual internship simultaneously called Vinternship. You can get the exactly details of the Completed, Active and Upcoming cohorts of internship on their cohort agnostic website. All the cohorts are given a unique for identification purposes. Names of different batches are Founders Keepers, Euclideans, Dijkstrians.',
        remarks: null,
        category: 'Internship Overview',
        tags: ['internship', 'cohorts', 'vinternship', 'program'],
        resources: [
          {
            name: 'Vinternship Website',
            url: 'https://sudarshansudarshan.github.io/vinternship/',
            type: 'website',
          },
        ],
        priority: 5,
      },
      {
        question: 'I can see this score in the vibe platform, right above my video. What is that?',
        answer:
          'The score you see above your video on the right side in ViBe is known as penalty score. ViBe is an AI-enabled learning platform which proctors your activity while watching the videos. It makes sure if your are paying attention while watching the videos. If there is someone besides you, the penalty score goes up. If someone is speaking, it goes up. If someone is moving their head, it goes up.',
        remarks:
          'Please note: Penalty Score does not have any affect on your HP (Health Points) during the course of your internship. However, it is to alert you to watch the videos attentively and in favourable conditions.',
        category: 'ViBe Platform',
        tags: ['penalty', 'score', 'vibe', 'proctoring', 'attention'],
        resources: [],
        priority: 4,
      },
      {
        question: 'What are the links to Telegram Channels?',
        answer:
          'You can find the link to the telegram channel from the Home Page of the Vinternship Website. The Telegram link provide on the home page will redirect you to the Main Vinternship Telegram Channel. You can check the pinned messages on the Vinternship Channel to join your own cohort specific channel.',
        remarks: null,
        category: 'Communication',
        tags: ['telegram', 'communication', 'channels', 'chat'],
        resources: [
          {
            name: 'Vinternship Website',
            url: 'https://sudarshansudarshan.github.io/vinternship/',
            type: 'website',
          },
          {
            name: 'Vinternship Telegram Channel',
            url: 'https://t.me/+YZfjSErJWppkZTRl',
            type: 'telegram',
          },
        ],
        priority: 4,
      },
      {
        question: 'What is the timeline of the internship?',
        answer:
          'Refer to FAQ 1.2 on the Vinternship Website to know about the Timeline of the internship.',
        remarks: null,
        category: 'Internship Overview',
        tags: ['timeline', 'schedule', 'duration', 'dates'],
        resources: [
          {
            name: 'Internship Timeline FAQ',
            url: 'https://sudarshansudarshan.github.io/vinternship/faq/#1-internship-overview',
            type: 'documentation',
          },
        ],
        priority: 4,
      },
      {
        question: 'What are milestones for the internship?',
        answer:
          'To know about the milestones, please refer to the milestones page on the Vinternship Website.',
        remarks:
          'Please note: Milestones for the Kruskalians batch are different. Please refer to the Important Notes section on this page to know about the milestones.',
        category: 'Internship Overview',
        tags: ['milestones', 'progress', 'checkpoints', 'goals'],
        resources: [
          {
            name: 'Milestones Page',
            url: 'https://sudarshansudarshan.github.io/vinternship/milestones/',
            type: 'documentation',
          },
          {
            name: 'Kruskalians Batch Notes',
            url: 'https://sudarshansudarshan.github.io/vinternship/cohort3/',
            type: 'documentation',
          },
        ],
        priority: 5,
      },
      {
        question: 'How do I submit the case studies?',
        answer:
          'Refer FAQ 8.5 on the Vinternship Website to know about the procedure to submit the case studies. 1. Visit the submission form provided in your cohort specific pages. 2. Fill in all required details carefully, including: First name and last name, Email ID associated with the internship and Technology name and lesson number complete. 3. Upload the file containing your solution for the specific lesson (supported formats include .js, .ts, .txt, .zip, etc.). 4. Review your details and submit the form. 5. Repeat this process for each lesson you complete. 6. Ensure that the upload has been successful.',
        remarks: null,
        category: 'Case Studies & Submissions',
        tags: ['submission', 'case-studies', 'mern', 'upload', 'files'],
        resources: [
          {
            name: 'Case Studies Submission FAQ',
            url: 'https://sudarshansudarshan.github.io/vinternship/faq/#8-mern-case-studies',
            type: 'documentation',
          },
        ],
        priority: 5,
      },
      {
        question: 'Is the slot booking form mandatory to fill?',
        answer:
          'The slot booking feature allows students to schedule dedicated time slots to learn on the ViBe platform. From now on, students can book learning slots in advance as part of a commitment-based learning system. Each day, a total of 24 slots are available. Students may: Choose any number of slots based on their availability. Commit a specific percentage of course progress they plan to complete during those selected slots. Once a slot is booked, the student is expected to be active on ViBe during that time. If a student does not attend or engage during their booked slots, penalties may be applied, as the system treats slot booking as a commitment. This for the benefit of the student to commit and progress each day during the internship track. It is not mandatory but committing will ultimately help the participant in progressing further in the course.',
        remarks: null,
        category: 'Slot Booking',
        tags: ['slots', 'booking', 'commitment', 'schedule', 'learning'],
        resources: [],
        priority: 4,
      },
    ];

    // Insert into golden_answers collection
    const goldenCollection = db.collection('golden_answers');

    for (const faq of faqData) {
      const doc = {
        ...faq,
        normalizedQuestion: normalizeText(faq.question),
        type: 'golden',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        version: 1,
      };

      try {
        const result = await goldenCollection.insertOne(doc);
        console.log(`✓ Added: "${faq.question}"`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(
            `⚠ Skipped (duplicate): "${faq.question}"`
          );
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ FAQ data seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding FAQ data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedFAQData();
}

module.exports = { seedFAQData };