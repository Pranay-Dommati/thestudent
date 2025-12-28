export interface CourseForm {
  title: string;
  category: string;
  board: string;
  subject: string;
  duration: string;
  price: string;
  description: string;
  thumbnail: File | null;
  youtubeLink: string;
  subtopics: Subtopic[];
  requirements: string[];
  learningObjectives: string[];
}

export interface Subtopic {
  title: string;
  link: string;
  type: 'video' | 'article';
  duration: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
}