
export const DEFAULT_PURPOSES = [
  'Reading Books',
  'Research in Thesis',
  'Use of Computer',
  'Doing Assignments'
] as const;

export const USER_TYPES = [
  'Student',
  'Faculty',
  'Staff',
  'Alumni'
] as const;

export const COLLEGES = {
  "Undergraduate Colleges": [
    "College of Accountancy",
    "College of Agriculture",
    "College of Arts and Sciences",
    "College of Business Administration",
    "College of Communication",
    "College of Informatics and Computing Studies",
    "College of Criminology",
    "College of Education",
    "College of Engineering and Architecture",
    "College of Medical Technology",
    "College of Midwifery",
    "College of Music",
    "College of Nursing",
    "College of Physical Therapy",
    "College of Respiratory Therapy"
  ],
  "Professional and Graduate Schools": [
    "College of Law",
    "College of Medicine",
    "School of International Relations",
    "School of Graduate Studies"
  ]
};

export const ALL_COLLEGES = [
  ...COLLEGES["Undergraduate Colleges"],
  ...COLLEGES["Professional and Graduate Schools"]
];
