export interface PrinterModel {
  id: string;
  manufacturer: string;
  model: string;
  series?: string;
  formFactor: 'desktop' | 'workgroup' | 'departmental' | 'production' | 'wide-format' | 'portable';
  type: 'laser' | 'inkjet' | 'led' | 'solid-ink' | 'thermal';
  color: boolean;
  functions: ('print' | 'copy' | 'scan' | 'fax')[];

  // Specifications
  specifications: {
    printSpeed: {
      mono: number; // pages per minute
      color?: number;
    };
    printResolution: {
      max: string; // e.g., "1200x1200 dpi"
      enhanced?: string;
    };
    firstPageOut: {
      mono: number; // seconds
      color?: number;
    };
    duty: {
      monthly: number; // max pages per month
      recommended: number; // recommended pages per month
    };
    paperHandling: {
      inputCapacity: number;
      outputCapacity: number;
      maxInputCapacity?: number; // with optional trays
      duplexing: 'standard' | 'optional' | 'none';
      paperSizes: string[];
      paperWeights: string;
    };
    memory: string;
    processor?: string;
    connectivity: string[];
    networkProtocols?: string[];
    dimensions: {
      width: number;
      depth: number;
      height: number;
      weight: number;
      unit: 'mm' | 'inches';
      weightUnit: 'kg' | 'lbs';
    };
    powerConsumption: {
      operating: string;
      standby: string;
      sleep: string;
    };
  };

  // Sales Information
  sales: {
    msrp: number;
    currency: string;
    streetPrice?: number;
    targetMarket: string[];
    sellingPoints: string[];
    competitiveAdvantages: string[];
    idealFor: string[];
  };

  // Cost Information
  costs: {
    consumables: {
      tonerCartridges: {
        black: { partNumber: string; yield: number; cost: number };
        cyan?: { partNumber: string; yield: number; cost: number };
        magenta?: { partNumber: string; yield: number; cost: number };
        yellow?: { partNumber: string; yield: number; cost: number };
      };
      drums?: {
        black?: { partNumber: string; yield: number; cost: number };
        color?: { partNumber: string; yield: number; cost: number };
      };
      fuserKit?: { partNumber: string; yield: number; cost: number };
      maintenanceKit?: { partNumber: string; yield: number; cost: number };
      wasteContainer?: { partNumber: string; yield: number; cost: number };
    };
    costPerPage: {
      mono: number;
      color?: number;
    };
  };

  // Setup Information
  setup: {
    unboxing: string[];
    initialSetup: string[];
    networkSetup: {
      ethernet?: string[];
      wifi?: string[];
      usb?: string[];
    };
    webInterface: {
      accessUrl: string; // e.g., "http://[printer-ip]" or "https://[printer-ip]"
      defaultCredentials?: {
        username?: string;
        password?: string;
      };
      certificateWarning?: string; // For self-signed HTTPS certs
      accessSteps: string[];
    };
    driverInstallation: {
      windows10?: string;
      windows11?: string;
      mac?: string;
      linux?: string;
      driverDownloads: {
        windows?: string; // Direct link to driver page
        mac?: string;
        linux?: string;
        universal?: string; // Universal driver link if available
      };
    };
    backupRestore?: {
      systemBackup: {
        procedure: string[];
        fileFormat?: string;
        location?: string;
      };
      systemRestore: {
        procedure: string[];
        prerequisites?: string[];
      };
      addressBookBackup?: {
        procedure: string[];
        fileFormat?: string;
        location?: string;
      };
      addressBookRestore?: {
        procedure: string[];
        prerequisites?: string[];
      };
    };
    scanDestinations?: {
      scanToEmail?: {
        requirements: string[];
        smtpConfiguration: string[];
        authenticationSetup?: string[];
        testProcedure?: string[];
      };
      scanToFolder?: {
        requirements: string[];
        smbConfiguration?: string[];
        ftpConfiguration?: string[];
        authenticationSetup?: string[];
        testProcedure?: string[];
      };
      scanToUsb?: {
        requirements: string[];
        procedure: string[];
        supportedFormats?: string[];
      };
    };
    configPages: {
      meterPage: string;
      configPage: string;
      networkConfigPage?: string;
      webInterface: string;
    };
    commonIssues: string[];
  };

  // Troubleshooting
  troubleshooting: {
    commonErrors: ErrorCode[];
    paperJams: PaperJamGuide[];
    qualityIssues: QualityIssue[];
    networkIssues: NetworkIssue[];
    generalMaintenance: MaintenanceTask[];
  };

  // Additional Information
  firmware?: {
    latest: string;
    releaseDate: string;
    updateProcedure: string;
  };
  warranty: {
    standard: string;
    extendedOptions?: string[];
  };
  certifications?: string[];
  releaseDate?: string;
  endOfLife?: string;
  successor?: string;
}

export interface ErrorCode {
  code: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  causes: string[];
  solutions: string[];
  partsNeeded?: string[];
}

export interface PaperJamGuide {
  location: string;
  accessInstructions: string[];
  clearanceSteps: string[];
  prevention: string[];
}

export interface QualityIssue {
  issue: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
}

export interface NetworkIssue {
  issue: string;
  symptoms: string[];
  diagnosticSteps: string[];
  solutions: string[];
}

export interface MaintenanceTask {
  task: string;
  frequency: string;
  procedure: string[];
  partsNeeded?: string[];
}

export interface PrinterSearchCriteria {
  manufacturer?: string;
  formFactor?: string;
  type?: string;
  color?: boolean;
  functions?: string[];
  minSpeed?: number;
  maxSpeed?: number;
  minPrice?: number;
  maxPrice?: number;
  maxDutyMonthly?: number;
  keywords?: string;
}

export interface TCOCalculation {
  printer: PrinterModel;
  monthlyVolume: number;
  years: number;
  breakdown: {
    hardwareCost: number;
    tonerCost: number;
    maintenanceCost: number;
    powerCost: number;
    total: number;
  };
  costPerPage: number;
  totalPages: number;
}
