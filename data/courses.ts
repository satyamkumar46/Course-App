export type Course = {
  id: string;
  title: string;
  instructor: string;
  price: number;
  rating: number;
  students: number;
  thumbnail: string;
  description: string;
  duration: string;
  category: string;
};

export const COURSES: Course[] = [
  {
    id: '1',
    title: 'React Native Mastery',
    instructor: 'Jane Smith',
    price: 49.99,
    rating: 4.8,
    students: 12500,
    thumbnail: 'https://picsum.photos/seed/rn1/400/240',
    description:
      'Build production-ready mobile apps with React Native. Learn hooks, navigation, state management, and native modules.',
    duration: '12 hours',
    category: 'Mobile Development',
  },
  {
    id: '2',
    title: 'TypeScript Fundamentals',
    instructor: 'John Doe',
    price: 29.99,
    rating: 4.9,
    students: 8200,
    thumbnail: 'https://picsum.photos/seed/ts1/400/240',
    description:
      'Master TypeScript from basics to advanced. Type-safe code, generics, decorators, and integration with React.',
    duration: '8 hours',
    category: 'Programming',
  },
  {
    id: '3',
    title: 'UI/UX Design for Developers',
    instructor: 'Alex Chen',
    price: 39.99,
    rating: 4.7,
    students: 5600,
    thumbnail: 'https://picsum.photos/seed/ui1/400/240',
    description:
      'Design beautiful interfaces. Learn Figma, design systems, accessibility, and user research basics.',
    duration: '10 hours',
    category: 'Design',
  },
  {
    id: '4',
    title: 'Node.js Backend Development',
    instructor: 'Sarah Wilson',
    price: 44.99,
    rating: 4.6,
    students: 9300,
    thumbnail: 'https://picsum.photos/seed/node1/400/240',
    description:
      'Build scalable APIs with Node.js and Express. Authentication, databases, and deployment.',
    duration: '14 hours',
    category: 'Backend',
  },
  {
    id: '5',
    title: 'Expo & React Native',
    instructor: 'Mike Johnson',
    price: 34.99,
    rating: 4.8,
    students: 4200,
    thumbnail: 'https://picsum.photos/seed/expo1/400/240',
    description:
      'Rapid mobile development with Expo. Managed workflow, OTA updates, and native builds.',
    duration: '6 hours',
    category: 'Mobile Development',
  },
];
