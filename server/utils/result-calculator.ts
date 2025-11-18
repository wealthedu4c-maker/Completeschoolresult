interface SubjectScore {
  subject: string;
  ca1: number;
  ca2: number;
  exam: number;
  total?: number;
  grade?: string;
  remark?: string;
}

export function calculateResults(subjects: SubjectScore[]): {
  subjects: SubjectScore[];
  totalScore: number;
  averageScore: number;
} {
  let totalScore = 0;

  const calculatedSubjects = subjects.map((subject) => {
    // Calculate total for each subject
    const total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);

    // Calculate grade
    let grade = "F";
    if (total >= 80) grade = "A";
    else if (total >= 70) grade = "B";
    else if (total >= 60) grade = "C";
    else if (total >= 50) grade = "D";
    else if (total >= 40) grade = "E";

    // Calculate remark
    let remark = "Poor";
    if (total >= 70) remark = "Excellent";
    else if (total >= 60) remark = "Very Good";
    else if (total >= 50) remark = "Good";
    else if (total >= 40) remark = "Fair";

    totalScore += total;

    return {
      ...subject,
      total,
      grade,
      remark,
    };
  });

  const averageScore = subjects.length > 0 
    ? parseFloat((totalScore / subjects.length).toFixed(2)) 
    : 0;

  return {
    subjects: calculatedSubjects,
    totalScore,
    averageScore,
  };
}

export function generatePIN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      pin += "-";
    }
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return pin;
}
