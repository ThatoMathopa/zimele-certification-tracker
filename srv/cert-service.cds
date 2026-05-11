using zimele.certtracker from '../db/schema';

service CertTrackerService @(path: '/odata/v4/cert') {

  entity Employees         as projection on certtracker.Employees;
  entity Certifications    as projection on certtracker.Certifications;
  entity LearningProgress  as projection on certtracker.LearningProgress;
  entity CertificationCatalog as projection on certtracker.CertificationCatalog;

  action getDashboardStats() returns {
    totalEmployees    : Integer;
    totalCerts        : Integer;
    activeCerts       : Integer;
    expiredCerts      : Integer;
    expiringSoonCerts : Integer;
    inProgressCerts   : Integer;
    coveragePercent   : Decimal(5,2);
    totalInvestment   : Decimal(12,2);
  };

  action getSkillsCoverage() returns array of {
    moduleArea      : String;
    certifiedCount  : Integer;
    expiringCount   : Integer;
    totalEmployees  : Integer;
    coveragePercent : Decimal(5,2);
  };

  action getExpiryAlerts(daysAhead : Integer) returns array of {
    employeeName  : String;
    certName      : String;
    expiryDate    : Date;
    daysRemaining : Integer;
    status        : String;
  };
}
