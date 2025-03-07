/**
 * This file contains mock data for developer mode
 * Used when the developer mode toggle is enabled
 */

// Property data
export const mockProperties = [
  {
    id: 'mock-property-1',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    price: 2500000,
    squareFeet: 3500,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2015,
    propertyType: 'Single Family',
    status: 'Active',
    createdAt: '2023-01-15T00:00:00.000Z',
    updatedAt: '2023-04-10T00:00:00.000Z',
    latitude: 37.7749,
    longitude: -122.4194,
    description: 'Gorgeous modern home in the heart of San Francisco with stunning views and high-end finishes.',
    progress: 85,
    stage: 'Contract Negotiation',
    owner: 'Jane Smith',
    phone: '(415) 555-1234',
    email: 'jane.smith@example.com',
    notes: 'Owner is motivated to sell. Property has been well-maintained with recent renovations.',
    lease: {
      startDate: '2023-06-01',
      endDate: '2028-05-31',
      term: '5 years',
      rate: 4500,
      escalation: '3% annual',
      options: '1 option to extend for 5 years'
    }
  },
  {
    id: 'mock-property-2',
    address: '456 Oak Ave',
    city: 'Oakland',
    state: 'CA',
    zip: '94610',
    price: 1850000,
    squareFeet: 2800,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 2008,
    propertyType: 'Townhouse',
    status: 'Under Contract',
    createdAt: '2023-02-20T00:00:00.000Z',
    updatedAt: '2023-04-05T00:00:00.000Z',
    latitude: 37.8044,
    longitude: -122.2711,
    description: 'Modern townhouse in a quiet neighborhood with easy access to transportation and amenities.',
    progress: 65,
    stage: 'Due Diligence',
    owner: 'Robert Johnson',
    phone: '(510) 555-5678',
    email: 'robert.j@example.com',
    notes: 'Property has new HVAC system and roof installed in 2022.',
    lease: {
      startDate: '2023-08-01',
      endDate: '2026-07-31',
      term: '3 years',
      rate: 3200,
      escalation: '2.5% annual',
      options: 'No extension options'
    }
  },
  {
    id: 'mock-property-3',
    address: '789 Pine Blvd',
    city: 'Berkeley',
    state: 'CA',
    zip: '94704',
    price: 2100000,
    squareFeet: 3200,
    bedrooms: 4,
    bathrooms: 3.5,
    yearBuilt: 1998,
    propertyType: 'Multi-Family',
    status: 'Prospecting',
    createdAt: '2023-03-10T00:00:00.000Z',
    updatedAt: '2023-04-01T00:00:00.000Z',
    latitude: 37.8715,
    longitude: -122.2730,
    description: 'Well-maintained multi-family property near UC Berkeley. Great investment opportunity.',
    progress: 25,
    stage: 'Initial Contact',
    owner: 'Maria Garcia',
    phone: '(510) 555-9012',
    email: 'maria.g@example.com',
    notes: 'Owner is considering selling but hasn\'t committed yet. Building has strong rental history.',
    lease: {
      startDate: '',
      endDate: '',
      term: '',
      rate: 0,
      escalation: '',
      options: ''
    }
  }
];

// School data
export const mockSchools = [
  {
    id: 'mock-school-1',
    name: 'Oakwood Elementary',
    educationLevel: 'elementary',
    type: 'public',
    grades: {
      range: {
        low: 'K',
        high: '5'
      }
    },
    enrollment: 523,
    location: {
      address: {
        streetAddress: '100 Oakwood Lane',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94110'
      },
      distanceMiles: 0.5,
      coordinates: {
        latitude: 37.7594,
        longitude: -122.4107
      }
    },
    links: {
      website: 'https://example.com/oakwood',
      profile: 'https://example.com/oakwood/profile',
      ratings: 'https://example.com/oakwood/ratings',
      reviews: 'https://example.com/oakwood/reviews'
    },
    phone: '(415) 555-1234',
    district: {
      id: 'district-001',
      name: 'San Francisco Unified School District'
    },
    ratings: {
      overall: 8.5,
      academics: 8.7,
      collegeReadiness: 7.9,
      equity: 8.2
    }
  },
  {
    id: 'mock-school-2',
    name: 'Bayside Middle School',
    educationLevel: 'middle',
    type: 'public',
    grades: {
      range: {
        low: '6',
        high: '8'
      }
    },
    enrollment: 782,
    location: {
      address: {
        streetAddress: '400 Bayside Drive',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94110'
      },
      distanceMiles: 1.2,
      coordinates: {
        latitude: 37.7649,
        longitude: -122.4194
      }
    },
    links: {
      website: 'https://example.com/bayside',
      profile: 'https://example.com/bayside/profile',
      ratings: 'https://example.com/bayside/ratings',
      reviews: 'https://example.com/bayside/reviews'
    },
    phone: '(415) 555-5678',
    district: {
      id: 'district-001',
      name: 'San Francisco Unified School District'
    },
    ratings: {
      overall: 7.8,
      academics: 7.5,
      collegeReadiness: 7.2,
      equity: 7.9
    }
  },
  {
    id: 'mock-school-3',
    name: 'Highland High School',
    educationLevel: 'high',
    type: 'public',
    grades: {
      range: {
        low: '9',
        high: '12'
      }
    },
    enrollment: 1245,
    location: {
      address: {
        streetAddress: '1500 Highland Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94110'
      },
      distanceMiles: 1.8,
      coordinates: {
        latitude: 37.7551,
        longitude: -122.4055
      }
    },
    links: {
      website: 'https://example.com/highland',
      profile: 'https://example.com/highland/profile',
      ratings: 'https://example.com/highland/ratings',
      reviews: 'https://example.com/highland/reviews'
    },
    phone: '(415) 555-9012',
    district: {
      id: 'district-001',
      name: 'San Francisco Unified School District'
    },
    ratings: {
      overall: 8.1,
      academics: 8.0,
      collegeReadiness: 8.3,
      equity: 7.8
    }
  }
];

// Zoning data
export const mockZoningData = [
  {
    id: 'mock-zoning-1',
    zone_name: 'Single-Family Residential',
    zone_code: 'R-1',
    zone_type: 'Residential',
    zone_sub_type: 'Low Density',
    zone_guide: 'Intended for single-family dwellings on individual lots',
    permitted_uses: [
      'Single-family dwellings', 
      'Home occupations', 
      'Public parks',
      'Community gardens',
      'Accessory dwelling units'
    ],
    conditional_uses: [
      'Places of worship',
      'Schools',
      'Community centers',
      'Daycare facilities'
    ],
    prohibited_uses: [
      'Multi-family dwellings',
      'Commercial uses',
      'Industrial uses'
    ],
    description: 'One dwelling unit per lot. Minimum lot size of 5,000 sq ft.',
    last_updated: '2023-01-15',
    link: 'https://example.com/zoning/r1',
    controls: {
      standard: {
        maxHeight: '35 feet',
        maxLotCoverage: '40%',
        setbacks: {
          front: '20 feet',
          sides: '5 feet',
          rear: '15 feet'
        },
        minLotSize: '5,000 sq ft'
      }
    }
  },
  {
    id: 'mock-zoning-2',
    zone_name: 'Neighborhood Commercial',
    zone_code: 'C-1',
    zone_type: 'Commercial',
    zone_sub_type: 'Neighborhood',
    zone_guide: 'Local-serving retail, personal services, and small offices',
    permitted_uses: [
      'Retail stores', 
      'Restaurants', 
      'Professional offices', 
      'Personal services',
      'Cafes',
      'Bakeries',
      'Pharmacies'
    ],
    conditional_uses: [
      'Bars and lounges',
      'Drive-through facilities',
      'Medical clinics',
      'Community facilities'
    ],
    prohibited_uses: [
      'Heavy industrial',
      'Warehousing',
      'Adult entertainment'
    ],
    description: 'Intended for small-scale commercial uses serving nearby neighborhoods.',
    last_updated: '2023-02-20',
    link: 'https://example.com/zoning/c1',
    controls: {
      standard: {
        maxHeight: '45 feet',
        maxLotCoverage: '60%',
        setbacks: {
          front: '0 feet',
          sides: '0 feet',
          rear: '10 feet'
        },
        floorAreaRatio: '1.5'
      }
    }
  },
  {
    id: 'mock-zoning-3',
    zone_name: 'Light Industrial',
    zone_code: 'M-1',
    zone_type: 'Industrial',
    zone_sub_type: 'Light',
    zone_guide: 'Manufacturing, assembly, and research and development',
    permitted_uses: [
      'Manufacturing', 
      'Warehousing', 
      'Research facilities', 
      'Wholesale businesses',
      'Light assembly',
      'Technology offices',
      'Maker spaces'
    ],
    conditional_uses: [
      'Retail showrooms',
      'Commercial kitchens',
      'Breweries and distilleries',
      'Artist studios'
    ],
    prohibited_uses: [
      'Residential uses',
      'Heavy industrial',
      'Hazardous materials processing'
    ],
    description: 'Designed for industrial uses that do not create excessive noise, odor, or other nuisances.',
    last_updated: '2023-03-10',
    link: 'https://example.com/zoning/m1',
    controls: {
      standard: {
        maxHeight: '60 feet',
        maxLotCoverage: '70%',
        setbacks: {
          front: '10 feet',
          sides: '5 feet',
          rear: '10 feet'
        },
        floorAreaRatio: '2.0'
      }
    }
  }
];

// Permit data
export const mockPermits = [
  {
    id: 'mock-permit-1',
    permitNumber: 'BLD-2023-1234',
    type: 'Building',
    status: 'Approved',
    issuedDate: '2023-01-15',
    expirationDate: '2024-01-15',
    description: 'New construction of a two-story commercial building',
    applicant: 'ABC Development Co.',
    address: '123 Main St, San Francisco, CA 94105',
    valuation: 2500000,
    squareFootage: 15000,
    details: [
      { label: 'Work Class', value: 'New Construction' },
      { label: 'Occupancy Type', value: 'Business' },
      { label: 'Building Type', value: 'Commercial' }
    ]
  },
  {
    id: 'mock-permit-2',
    permitNumber: 'PLM-2023-5678',
    type: 'Plumbing',
    status: 'Pending',
    issuedDate: '2023-03-10',
    expirationDate: '',
    description: 'Installation of new plumbing system for office remodel',
    applicant: 'Modern Plumbing Inc.',
    address: '456 Oak Ave, Oakland, CA 94610',
    valuation: 75000,
    squareFootage: 0,
    details: [
      { label: 'Work Class', value: 'Alteration' },
      { label: 'Occupancy Type', value: 'Business' },
      { label: 'Building Type', value: 'Commercial' }
    ]
  },
  {
    id: 'mock-permit-3',
    permitNumber: 'ELE-2023-9012',
    type: 'Electrical',
    status: 'In Review',
    issuedDate: '',
    expirationDate: '',
    description: 'Electrical upgrades for residential property',
    applicant: 'Bright Electrical Services',
    address: '789 Pine Blvd, Berkeley, CA 94704',
    valuation: 45000,
    squareFootage: 0,
    details: [
      { label: 'Work Class', value: 'Alteration' },
      { label: 'Occupancy Type', value: 'Residential' },
      { label: 'Building Type', value: 'Multi-Family' }
    ]
  }
];

// Comments data
export const mockComments = [
  {
    id: 'mock-comment-1',
    text: 'Property has great potential for our educational programs. The layout would work well for classrooms and administrative offices.',
    createdAt: '2023-03-15T14:30:00.000Z',
    updatedAt: '2023-03-15T14:30:00.000Z',
    authorId: 'user-1',
    authorName: 'Jane Cooper',
    avatar: 'https://i.pravatar.cc/150?u=user1',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  },
  {
    id: 'mock-comment-2',
    text: 'I visited this site yesterday. The parking situation might be challenging during peak hours. We should consider nearby parking options.',
    createdAt: '2023-03-16T10:15:00.000Z',
    updatedAt: '2023-03-16T10:15:00.000Z',
    authorId: 'user-2',
    authorName: 'Robert Johnson',
    avatar: 'https://i.pravatar.cc/150?u=user2',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  },
  {
    id: 'mock-comment-3',
    text: 'Environmental assessment came back clean. No major issues found that would prevent acquisition.',
    createdAt: '2023-03-18T09:45:00.000Z',
    updatedAt: '2023-03-18T16:20:00.000Z',
    authorId: 'user-3',
    authorName: 'Elena Martinez',
    avatar: 'https://i.pravatar.cc/150?u=user3',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  }
];

// Files data
export const mockFiles = [
  {
    id: 'mock-file-1',
    filename: 'property-assessment.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    uploadDate: '2023-03-10T11:30:00.000Z',
    uploadedBy: {
      id: 'user-1',
      name: 'Jane Cooper'
    },
    description: 'Complete property assessment including structural evaluation and estimated renovation costs.',
    url: '#',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  },
  {
    id: 'mock-file-2',
    filename: 'floor-plans.dwg',
    fileSize: 3789456,
    mimeType: 'application/acad',
    uploadDate: '2023-03-12T14:15:00.000Z',
    uploadedBy: {
      id: 'user-2',
      name: 'Robert Johnson'
    },
    description: 'Detailed floor plans of all levels including measurements and room dimensions.',
    url: '#',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  },
  {
    id: 'mock-file-3',
    filename: 'environmental-report.pdf',
    fileSize: 1876543,
    mimeType: 'application/pdf',
    uploadDate: '2023-03-14T09:45:00.000Z',
    uploadedBy: {
      id: 'user-3',
      name: 'Elena Martinez'
    },
    description: 'Environmental assessment report including soil testing and hazardous materials survey.',
    url: '#',
    resourceId: 'mock-property-1',
    resourceType: 'property'
  }
];

// Contacts data
export const mockContacts = [
  {
    id: 'mock-contact-1',
    name: 'Sandra Williams',
    title: 'Real Estate Broker',
    company: 'Bay Area Properties',
    email: 'sandra.williams@bayareaproperties.example.com',
    phone: '(415) 555-7890',
    address: '350 Market St, San Francisco, CA 94105',
    notes: 'Excellent local knowledge, specializes in commercial properties in SF.'
  },
  {
    id: 'mock-contact-2',
    name: 'Michael Chen',
    title: 'Property Manager',
    company: 'Urban Property Management',
    email: 'michael.chen@urbanpm.example.com',
    phone: '(510) 555-4321',
    address: '880 Harrison St, Oakland, CA 94607',
    notes: 'Manages multiple commercial properties in Oakland and Berkeley.'
  },
  {
    id: 'mock-contact-3',
    name: 'Lisa Rodriguez',
    title: 'Commercial Loan Officer',
    company: 'Pacific Banking Group',
    email: 'l.rodriguez@pacificbanking.example.com',
    phone: '(415) 555-6543',
    address: '101 California St, San Francisco, CA 94111',
    notes: 'Specializes in financing for educational institutions and non-profits.'
  }
];

// Census data
export const mockCensusData = {
  demographics: {
    totalPopulation: 127500,
    medianAge: 36.4,
    ageDistribution: {
      under18: 18.5,
      age18to24: 12.3,
      age25to44: 38.7,
      age45to64: 20.2,
      age65plus: 10.3
    },
    raceEthnicity: {
      white: 48.2,
      black: 5.8,
      asian: 33.6,
      hispanic: 15.1,
      other: 7.3
    }
  },
  housing: {
    totalHousingUnits: 53200,
    occupancyRate: 94.5,
    ownerOccupied: 38.2,
    renterOccupied: 61.8,
    medianHomeValue: 1250000,
    medianRent: 2850
  },
  economics: {
    medianHouseholdIncome: 104500,
    povertyRate: 9.8,
    unemploymentRate: 3.5,
    educationLevels: {
      highSchoolOrLess: 12.3,
      someCollege: 15.7,
      bachelors: 39.5,
      graduate: 32.5
    }
  }
};

// Mock real estate pipeline data
export const mockRealEstatePipeline = [
  { id: 1, created_at: '2024-01-01', address: '123 Main St', phase: '0. New Site', campus_id: 'campus-1', site_name: 'Downtown Site' },
  { id: 2, created_at: '2024-01-02', address: '456 Park Ave', phase: '1. Initial Diligence', campus_id: 'campus-1', site_name: 'Park Location' },
  { id: 3, created_at: '2024-01-03', address: '789 Broadway', phase: '2. Survey', campus_id: 'campus-2', site_name: 'Broadway Complex' },
  { id: 4, created_at: '2024-01-04', address: '101 Market St', phase: '3. Test Fit', campus_id: 'campus-2', site_name: 'Market Center' },
  { id: 5, created_at: '2024-01-05', address: '222 Lake Dr', phase: '4. Plan Production', campus_id: 'campus-3', site_name: 'Lakeside Property' },
  { id: 6, created_at: '2024-01-06', address: '333 Oak St', phase: '5. Permitting', campus_id: 'campus-3', site_name: 'Oak Street Building' },
  { id: 7, created_at: '2024-01-07', address: '444 Pine St', phase: '6. Construction', campus_id: 'campus-1', site_name: 'Pine Building' },
  { id: 8, created_at: '2024-01-08', address: '555 Elm St', phase: '7. Set Up', campus_id: 'campus-2', site_name: 'Elm Street Site' },
  { id: 9, created_at: '2024-01-09', address: '666 Cedar St', phase: 'Hold', campus_id: 'campus-3', site_name: 'Cedar Location' },
  { id: 10, created_at: '2024-01-10', address: '777 Maple St', phase: 'Deprioritize', campus_id: 'campus-1', site_name: 'Maple Street Building' }
];

// Mock campuses data
export const mockCampuses = [
  { id: 'campus-1', campus_id: 'campus-1', campus_name: 'San Francisco', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'campus-2', campus_id: 'campus-2', campus_name: 'New York', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'campus-3', campus_id: 'campus-3', campus_name: 'Chicago', created_at: '2024-01-01', updated_at: '2024-01-01' }
];

// Helper function to get mock data based on type
export const getMockData = (type: string) => {
  switch (type) {
    case 'properties':
      return mockProperties;
    case 'schools':
      return mockSchools;
    case 'zoning':
      return mockZoningData;
    case 'permits':
      return mockPermits;
    case 'comments':
      return mockComments;
    case 'files':
      return mockFiles;
    case 'contacts':
      return mockContacts;
    case 'census':
      return mockCensusData;
    case 'real-estate-pipeline':
      return mockRealEstatePipeline;
    case 'campuses':
      return mockCampuses;
    default:
      return null;
  }
}; 