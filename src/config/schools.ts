export interface SchoolConfig {
  id: string;
  name: string;
  subtitle: string;
  logo: string;
  background: string;
  description: string;
}

export const schools: Record<string, SchoolConfig> = {
  summit: {
    id: "summit",
    name: "Summit School GPT",
    subtitle: "Summit International School",
    logo: "/school-logo.png",
    background: "/school-bg.jpg",
    description: "A smarter way to manage learning, assessments, and student growth."
  },
  // Add more schools here
  example: {
    id: "example",
    name: "Example School GPT",
    subtitle: "Example International School",
    logo: "/example-logo.png",
    background: "/example-bg.jpg",
    description: "Example school description."
  },
  myschool: {
    id: "myschool",
    name: "My School GPT",
    subtitle: "My International School",
    logo: "/myschool-logo.png",
    background: "/myschool-bg.jpg",
    description: "My school description."
  }
};

export const getCurrentSchool = (): SchoolConfig => {
  const school = import.meta.env.VITE_SCHOOL || 'summit';
  return schools[school] || schools.summit;
};