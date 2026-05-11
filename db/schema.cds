namespace zimele.certtracker;

using { cuid, managed } from '@sap/cds/common';

// Employees
entity Employees : cuid, managed {
  employeeId    : String(20);
  firstName     : String(100);
  lastName      : String(100);
  email         : String(200);
  role          : String(100);
  department    : String(100);
  manager       : String(200);
  joinDate      : Date;
  isActive      : Boolean default true;
  certifications: Composition of many Certifications on certifications.employee = $self;
  learningPaths : Composition of many LearningProgress on learningPaths.employee = $self;
}

// SAP Certifications
entity Certifications : cuid, managed {
  employee      : Association to Employees;
  certCode      : String(50);
  certName      : String(300);
  certModule    : String(100);
  issueDate     : Date;
  expiryDate    : Date;
  status        : String(20);
  credlyBadgeUrl: String(500);
  proofDocUrl   : String(500);
  verifiedBy    : String(200);
  verifiedOn    : Date;
  renewalCost   : Decimal(10,2);
  notes         : String(1000);
}

// Learning Progress
entity LearningProgress : cuid, managed {
  employee       : Association to Employees;
  courseName     : String(300);
  courseProvider : String(100);
  courseUrl      : String(500);
  moduleArea     : String(100);
  startDate      : Date;
  completionDate : Date;
  status         : String(20);
  hoursSpent     : Decimal(6,1);
  certificateUrl : String(500);
}

// SAP Certification Catalog
entity CertificationCatalog : cuid {
  certCode      : String(50);
  certName      : String(300);
  certModule    : String(100);
  examDuration  : Integer;
  passingScore  : Integer;
  examCost      : Decimal(10,2);
  validityMonths: Integer default 12;
  isActive      : Boolean default true;
  description   : String(2000);
  prepTimeWeeks : Integer;
}

// Skills Coverage view
entity SkillsCoverage : cuid {
  moduleArea      : String(100);
  totalEmployees  : Integer;
  certifiedCount  : Integer;
  expiringCount   : Integer;
  inProgressCount : Integer;
  coveragePercent : Decimal(5,2);
}
