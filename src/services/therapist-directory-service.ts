/**
 * Therapist Directory Service
 * Geo-location based therapist discovery platform
 * "Angie's List for Speech-Language Pathologists"
 */

export interface TherapistProfile {
  id: string;
  npi: string;
  name: {
    first: string;
    last: string;
    credentials: string[];
  };
  photo?: string;
  verified: boolean;
  
  // Location & Contact
  locations: PracticeLocation[];
  phone: string;
  email: string;
  website?: string;
  
  // Professional Details
  specialties: Specialty[];
  certifications: Certification[];
  experience: {
    yearsOfPractice: number;
    populationsServed: string[];
    settingsExperience: string[];
  };
  
  // Services & Availability
  services: TherapyService[];
  availability: AvailabilitySchedule;
  telehealth: {
    available: boolean;
    platforms: string[];
    statesCovered: string[];
  };
  
  // Insurance & Billing
  insuranceAccepted: InsuranceProvider[];
  paymentOptions: PaymentOption[];
  rates: {
    evaluation: number;
    therapy: number;
    consultation: number;
  };
  
  // Reviews & Ratings
  rating: {
    overall: number;
    totalReviews: number;
    breakdown: {
      clinical: number;
      communication: number;
      accessibility: number;
      technology: number;
      billing: number;
    };
  };
  
  // TinkyBink Integration
  tinkyBinkCertified: boolean;
  tinkyBinkUsage: {
    activeUser: boolean;
    patientsOnPlatform: number;
    successStories: number;
  };
}

export interface PracticeLocation {
  id: string;
  isPrimary: boolean;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  accessibility: {
    wheelchairAccessible: boolean;
    parking: boolean;
    publicTransit: boolean;
  };
  amenities: string[];
}

export interface TherapyService {
  type: string;
  description: string;
  ageGroups: string[];
  duration: number;
  groupSize: 'individual' | 'small_group' | 'large_group';
  tinkyBinkIntegrated: boolean;
}

export interface InsuranceProvider {
  name: string;
  plans: string[];
  verificationStatus: 'verified' | 'pending' | 'not_accepted';
  lastUpdated: Date;
}

export interface TherapistReview {
  id: string;
  therapistId: string;
  reviewerId: string;
  patientAge: number;
  diagnosis: string;
  treatmentDuration: string;
  
  ratings: {
    overall: number;
    clinical: number;
    communication: number;
    accessibility: number;
    technology: number;
    billing: number;
  };
  
  writtenReview: string;
  pros: string[];
  cons: string[];
  
  verified: boolean;
  helpful: number;
  date: Date;
  
  therapistResponse?: {
    response: string;
    date: Date;
  };
}

export interface SearchFilters {
  location: {
    center: { lat: number; lng: number };
    radius: number; // miles
  };
  insurance?: string[];
  specialties?: string[];
  ageGroups?: string[];
  availability?: {
    nextAvailable: Date;
    preferredDays: string[];
    preferredTimes: string[];
  };
  telehealth?: boolean;
  rating?: number; // minimum rating
  tinkyBinkCertified?: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
}

class TherapistDirectoryService {
  private static instance: TherapistDirectoryService;
  
  private therapists: Map<string, TherapistProfile> = new Map();
  private reviews: Map<string, TherapistReview[]> = new Map();
  private insuranceDatabase: Map<string, InsuranceProvider[]> = new Map();
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): TherapistDirectoryService {
    if (!TherapistDirectoryService.instance) {
      TherapistDirectoryService.instance = new TherapistDirectoryService();
    }
    return TherapistDirectoryService.instance;
  }
  
  private initialize(): void {
    console.log('🗺️ Therapist Directory Service initialized');
    this.loadTherapistDatabase();
    this.loadInsuranceDatabase();
  }
  
  /**
   * Search therapists by location and filters
   */
  async searchTherapists(filters: SearchFilters): Promise<{
    therapists: TherapistProfile[];
    totalFound: number;
    avgDistance: number;
    insuranceMatches: number;
  }> {
    const results = Array.from(this.therapists.values())
      .filter(therapist => this.matchesFilters(therapist, filters))
      .map(therapist => ({
        ...therapist,
        distance: this.calculateDistance(
          filters.location.center,
          therapist.locations[0].address.coordinates
        )
      }))
      .filter(therapist => therapist.distance <= filters.location.radius)
      .sort((a, b) => {
        // Sort by: insurance match, rating, distance
        const aInsuranceMatch = this.hasInsuranceMatch(a, filters.insurance);
        const bInsuranceMatch = this.hasInsuranceMatch(b, filters.insurance);
        
        if (aInsuranceMatch !== bInsuranceMatch) {
          return bInsuranceMatch ? 1 : -1;
        }
        
        if (Math.abs(a.rating.overall - b.rating.overall) > 0.3) {
          return b.rating.overall - a.rating.overall;
        }
        
        return a.distance - b.distance;
      });
    
    const insuranceMatches = results.filter(t => this.hasInsuranceMatch(t, filters.insurance)).length;
    const avgDistance = results.reduce((sum, t) => sum + t.distance, 0) / results.length;
    
    return {
      therapists: results,
      totalFound: results.length,
      avgDistance: Math.round(avgDistance * 10) / 10,
      insuranceMatches
    };
  }
  
  /**
   * Verify insurance acceptance in real-time
   */
  async verifyInsurance(
    therapistId: string,
    insuranceInfo: {
      provider: string;
      planName: string;
      memberId: string;
      groupNumber?: string;
    }
  ): Promise<{
    accepted: boolean;
    copay: number;
    deductible: number;
    coinsurance: number;
    authRequired: boolean;
    effectiveDate: Date;
    expirationDate: Date;
  }> {
    // In production, this would call insurance verification APIs
    return {
      accepted: true,
      copay: 25,
      deductible: 500,
      coinsurance: 20,
      authRequired: false,
      effectiveDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * Get therapist recommendations based on user profile
   */
  async getRecommendations(userProfile: {
    location: { lat: number; lng: number };
    childAge: number;
    diagnosis: string;
    insurance: string;
    preferences: string[];
  }): Promise<{
    primary: TherapistProfile[];
    alternative: TherapistProfile[];
    reasoning: string[];
  }> {
    const filters: SearchFilters = {
      location: {
        center: userProfile.location,
        radius: 25
      },
      insurance: [userProfile.insurance],
      specialties: this.mapDiagnosisToSpecialties(userProfile.diagnosis),
      ageGroups: this.mapAgeToGroups(userProfile.childAge)
    };
    
    const results = await this.searchTherapists(filters);
    
    // AI-powered ranking based on success with similar cases
    const scored = results.therapists.map(therapist => ({
      therapist,
      score: this.calculateMatchScore(therapist, userProfile),
      reasoning: this.generateRecommendationReasoning(therapist, userProfile)
    })).sort((a, b) => b.score - a.score);
    
    return {
      primary: scored.slice(0, 3).map(s => s.therapist),
      alternative: scored.slice(3, 8).map(s => s.therapist),
      reasoning: scored.slice(0, 3).map(s => s.reasoning)
    };
  }
  
  /**
   * Submit therapist review
   */
  async submitReview(review: Omit<TherapistReview, 'id' | 'date' | 'helpful' | 'verified'>): Promise<{
    reviewId: string;
    verificationRequired: boolean;
    estimatedImpact: number;
  }> {
    const reviewId = `review_${Date.now()}`;
    const newReview: TherapistReview = {
      ...review,
      id: reviewId,
      date: new Date(),
      helpful: 0,
      verified: false
    };
    
    if (!this.reviews.has(review.therapistId)) {
      this.reviews.set(review.therapistId, []);
    }
    this.reviews.get(review.therapistId)!.push(newReview);
    
    // Update therapist rating
    this.updateTherapistRating(review.therapistId);
    
    // Send verification email to reviewer
    await this.sendReviewVerification(reviewId);
    
    return {
      reviewId,
      verificationRequired: true,
      estimatedImpact: this.calculateReviewImpact(review)
    };
  }
  
  private matchesFilters(therapist: TherapistProfile, filters: SearchFilters): boolean {
    if (filters.insurance?.length) {
      const hasInsurance = filters.insurance.some(insurance =>
        therapist.insuranceAccepted.some(accepted => accepted.name === insurance)
      );
      if (!hasInsurance) return false;
    }
    
    if (filters.specialties?.length) {
      const hasSpecialty = filters.specialties.some(specialty =>
        therapist.specialties.some(ts => ts.name === specialty)
      );
      if (!hasSpecialty) return false;
    }
    
    if (filters.rating && therapist.rating.overall < filters.rating) {
      return false;
    }
    
    if (filters.tinkyBinkCertified && !therapist.tinkyBinkCertified) {
      return false;
    }
    
    return true;
  }
  
  private calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private hasInsuranceMatch(therapist: TherapistProfile, insurance?: string[]): boolean {
    if (!insurance?.length) return true;
    return insurance.some(ins => 
      therapist.insuranceAccepted.some(accepted => accepted.name === ins)
    );
  }
  
  private calculateMatchScore(therapist: TherapistProfile, userProfile: any): number {
    let score = 0;
    
    // Base rating weight
    score += therapist.rating.overall * 20;
    
    // Specialty match
    const specialtyMatch = therapist.specialties.some(s => 
      this.mapDiagnosisToSpecialties(userProfile.diagnosis).includes(s.name)
    );
    if (specialtyMatch) score += 25;
    
    // TinkyBink integration
    if (therapist.tinkyBinkCertified) score += 15;
    if (therapist.tinkyBinkUsage.activeUser) score += 10;
    
    // Experience with age group
    const ageGroup = this.mapAgeToGroups(userProfile.childAge)[0];
    if (therapist.experience.populationsServed.includes(ageGroup)) score += 20;
    
    // Success stories
    score += Math.min(therapist.tinkyBinkUsage.successStories * 2, 10);
    
    return score;
  }
  
  private generateRecommendationReasoning(therapist: TherapistProfile, userProfile: any): string {
    const reasons = [];
    
    if (therapist.rating.overall >= 4.8) {
      reasons.push(`Exceptional ${therapist.rating.overall.toFixed(1)}⭐ rating from ${therapist.rating.totalReviews} families`);
    }
    
    if (therapist.tinkyBinkCertified) {
      reasons.push('TinkyBink Certified - Expert in AAC technology');
    }
    
    const relevantSpecialty = therapist.specialties.find(s => 
      this.mapDiagnosisToSpecialties(userProfile.diagnosis).includes(s.name)
    );
    if (relevantSpecialty) {
      reasons.push(`Specializes in ${relevantSpecialty.name}`);
    }
    
    if (therapist.experience.yearsOfPractice >= 10) {
      reasons.push(`${therapist.experience.yearsOfPractice}+ years of experience`);
    }
    
    if (therapist.tinkyBinkUsage.successStories > 50) {
      reasons.push(`${therapist.tinkyBinkUsage.successStories} documented success stories`);
    }
    
    return reasons.join(' • ');
  }
  
  private mapDiagnosisToSpecialties(diagnosis: string): string[] {
    const mapping: Record<string, string[]> = {
      'autism': ['Autism Spectrum Disorders', 'Augmentative and Alternative Communication', 'Social Communication'],
      'apraxia': ['Childhood Apraxia of Speech', 'Motor Speech Disorders'],
      'cerebral_palsy': ['Augmentative and Alternative Communication', 'Dysarthria'],
      'down_syndrome': ['Intellectual Disabilities', 'Augmentative and Alternative Communication'],
      'delayed_speech': ['Language Disorders', 'Speech Sound Disorders'],
      'stuttering': ['Fluency Disorders'],
      'voice_disorders': ['Voice Disorders']
    };
    
    return mapping[diagnosis] || ['Speech-Language Pathology'];
  }
  
  private mapAgeToGroups(age: number): string[] {
    if (age < 3) return ['Early Intervention', 'Infants and Toddlers'];
    if (age < 6) return ['Preschool', 'Early Childhood'];
    if (age < 13) return ['School-Age', 'Elementary'];
    if (age < 18) return ['Adolescent', 'Secondary'];
    return ['Adult'];
  }
  
  private updateTherapistRating(therapistId: string): void {
    const reviews = this.reviews.get(therapistId) || [];
    const therapist = this.therapists.get(therapistId);
    
    if (!therapist || reviews.length === 0) return;
    
    const totalReviews = reviews.length;
    const overall = reviews.reduce((sum, r) => sum + r.ratings.overall, 0) / totalReviews;
    const clinical = reviews.reduce((sum, r) => sum + r.ratings.clinical, 0) / totalReviews;
    const communication = reviews.reduce((sum, r) => sum + r.ratings.communication, 0) / totalReviews;
    const accessibility = reviews.reduce((sum, r) => sum + r.ratings.accessibility, 0) / totalReviews;
    const technology = reviews.reduce((sum, r) => sum + r.ratings.technology, 0) / totalReviews;
    const billing = reviews.reduce((sum, r) => sum + r.ratings.billing, 0) / totalReviews;
    
    therapist.rating = {
      overall: Math.round(overall * 10) / 10,
      totalReviews,
      breakdown: {
        clinical: Math.round(clinical * 10) / 10,
        communication: Math.round(communication * 10) / 10,
        accessibility: Math.round(accessibility * 10) / 10,
        technology: Math.round(technology * 10) / 10,
        billing: Math.round(billing * 10) / 10
      }
    };
  }
  
  private calculateReviewImpact(review: TherapistReview): number {
    // Calculate how much this review will impact the therapist's overall rating
    const existingReviews = this.reviews.get(review.therapistId)?.length || 0;
    const weight = 1 / (existingReviews + 1);
    return Math.round(weight * 100);
  }
  
  private async sendReviewVerification(reviewId: string): Promise<void> {
    console.log(`Verification email sent for review ${reviewId}`);
  }
  
  private loadTherapistDatabase(): void {
    // Load sample therapist data
    const sampleTherapist: TherapistProfile = {
      id: 'slp_001',
      npi: '1234567890',
      name: {
        first: 'Sarah',
        last: 'Johnson',
        credentials: ['MS', 'CCC-SLP', 'BCS-S']
      },
      verified: true,
      locations: [{
        id: 'loc_001',
        isPrimary: true,
        name: 'Pediatric Speech Center',
        address: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        accessibility: {
          wheelchairAccessible: true,
          parking: true,
          publicTransit: true
        },
        amenities: ['Sensory Room', 'Play Therapy Area', 'Parent Observation']
      }],
      phone: '(555) 123-4567',
      email: 'sarah.johnson@pediatricspeech.com',
      specialties: [
        { name: 'Autism Spectrum Disorders', certified: true, experience: 8 },
        { name: 'Augmentative and Alternative Communication', certified: true, experience: 10 },
        { name: 'Childhood Apraxia of Speech', certified: true, experience: 6 }
      ],
      certifications: [
        { name: 'ASHA Certificate of Clinical Competence', issued: new Date('2014-01-01') },
        { name: 'Board Certified Specialist in Swallowing', issued: new Date('2018-01-01') }
      ],
      experience: {
        yearsOfPractice: 10,
        populationsServed: ['Preschool', 'School-Age', 'Early Intervention'],
        settingsExperience: ['Private Practice', 'Schools', 'Early Intervention']
      },
      services: [{
        type: 'AAC Evaluation and Training',
        description: 'Comprehensive AAC assessment with TinkyBink integration',
        ageGroups: ['Preschool', 'School-Age'],
        duration: 60,
        groupSize: 'individual',
        tinkyBinkIntegrated: true
      }],
      availability: {} as any,
      telehealth: {
        available: true,
        platforms: ['TinkyBink Connect', 'Zoom', 'Doxy.me'],
        statesCovered: ['TX', 'OK', 'LA']
      },
      insuranceAccepted: [
        { name: 'Blue Cross Blue Shield', plans: ['PPO', 'HMO'], verificationStatus: 'verified', lastUpdated: new Date() },
        { name: 'Aetna', plans: ['PPO'], verificationStatus: 'verified', lastUpdated: new Date() },
        { name: 'United Healthcare', plans: ['PPO', 'Choice Plus'], verificationStatus: 'verified', lastUpdated: new Date() }
      ],
      paymentOptions: ['Insurance', 'Private Pay', 'HSA/FSA', 'Payment Plans'],
      rates: {
        evaluation: 250,
        therapy: 150,
        consultation: 125
      },
      rating: {
        overall: 4.9,
        totalReviews: 127,
        breakdown: {
          clinical: 4.9,
          communication: 5.0,
          accessibility: 4.8,
          technology: 4.9,
          billing: 4.7
        }
      },
      tinkyBinkCertified: true,
      tinkyBinkUsage: {
        activeUser: true,
        patientsOnPlatform: 45,
        successStories: 89
      }
    };
    
    this.therapists.set(sampleTherapist.id, sampleTherapist);
    console.log('Sample therapist database loaded');
  }
  
  private loadInsuranceDatabase(): void {
    // Load insurance verification data
    console.log('Insurance database loaded');
  }
}

// Define missing interfaces
interface Specialty {
  name: string;
  certified: boolean;
  experience: number;
}

interface Certification {
  name: string;
  issued: Date;
}

interface AvailabilitySchedule {
  // Define availability structure
}

interface PaymentOption {
  // Define payment options
}

export const therapistDirectoryService = TherapistDirectoryService.getInstance();
export default therapistDirectoryService;