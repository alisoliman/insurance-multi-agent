export interface DemoScenario {
  id: string
  title: string
  description: string
  category: 'auto' | 'home' | 'health' | 'life'
  complexity: 'simple' | 'moderate' | 'complex'
  data: {
    claim_description: string
    policy_number: string
    incident_date: string
    claim_type: string
    estimated_amount: number
    additional_info?: string
    customer_info?: {
      name: string
      email: string
      phone: string
    }
  }
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'auto-fender-bender',
    title: 'Minor Auto Accident',
    description: 'Simple fender bender with clear liability',
    category: 'auto',
    complexity: 'simple',
    data: {
      claim_description: 'Rear-ended at traffic light. Minor damage to bumper and taillight. Other driver admitted fault.',
      policy_number: 'AUTO-2024-001234',
      incident_date: '2024-06-01',
      claim_type: 'auto',
      estimated_amount: 2500,
      additional_info: 'Police report filed. Photos available.',
      customer_info: {
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0123'
      }
    }
  },
  {
    id: 'auto-total-loss',
    title: 'Total Loss Vehicle',
    description: 'High-value claim requiring detailed investigation',
    category: 'auto',
    complexity: 'complex',
    data: {
      claim_description: 'Vehicle totaled in highway collision. Airbags deployed. Significant damage to front end and engine compartment.',
      policy_number: 'AUTO-2024-005678',
      incident_date: '2024-05-28',
      claim_type: 'auto',
      estimated_amount: 35000,
      additional_info: 'Emergency services responded. Vehicle towed to certified facility.',
      customer_info: {
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0456'
      }
    }
  },
  {
    id: 'home-water-damage',
    title: 'Water Damage Claim',
    description: 'Burst pipe causing water damage to multiple rooms',
    category: 'home',
    complexity: 'moderate',
    data: {
      claim_description: 'Burst pipe in master bathroom caused flooding in bedroom and living room. Hardwood floors damaged, drywall needs replacement.',
      policy_number: 'HOME-2024-009876',
      incident_date: '2024-06-03',
      claim_type: 'home',
      estimated_amount: 15000,
      additional_info: 'Water mitigation company contacted immediately. Photos and moisture readings documented.',
      customer_info: {
        name: 'Michael Chen',
        email: 'mchen@email.com',
        phone: '+1-555-0789'
      }
    }
  },
  {
    id: 'home-theft',
    title: 'Burglary and Theft',
    description: 'Break-in with stolen electronics and jewelry',
    category: 'home',
    complexity: 'complex',
    data: {
      claim_description: 'Home burglarized while on vacation. Electronics, jewelry, and cash stolen. Front door lock damaged.',
      policy_number: 'HOME-2024-011223',
      incident_date: '2024-05-25',
      claim_type: 'home',
      estimated_amount: 25000,
      additional_info: 'Police report filed. Security system footage available. Itemized list of stolen items provided.',
      customer_info: {
        name: 'Emily Rodriguez',
        email: 'emily.r@email.com',
        phone: '+1-555-0321'
      }
    }
  },
  {
    id: 'health-emergency',
    title: 'Emergency Room Visit',
    description: 'Unexpected medical emergency requiring immediate care',
    category: 'health',
    complexity: 'moderate',
    data: {
      claim_description: 'Emergency room visit for severe chest pain. EKG, blood work, and CT scan performed. Diagnosed with anxiety attack.',
      policy_number: 'HEALTH-2024-445566',
      incident_date: '2024-06-05',
      claim_type: 'health',
      estimated_amount: 8500,
      additional_info: 'All medical records and bills provided. Pre-authorization not required for emergency care.',
      customer_info: {
        name: 'David Wilson',
        email: 'dwilson@email.com',
        phone: '+1-555-0654'
      }
    }
  },
  {
    id: 'health-surgery',
    title: 'Planned Surgery',
    description: 'Pre-authorized surgical procedure with complications',
    category: 'health',
    complexity: 'complex',
    data: {
      claim_description: 'Knee replacement surgery with post-operative complications requiring extended hospital stay and additional procedures.',
      policy_number: 'HEALTH-2024-778899',
      incident_date: '2024-05-15',
      claim_type: 'health',
      estimated_amount: 45000,
      additional_info: 'Pre-authorization obtained. Complications documented by surgeon. Extended physical therapy required.',
      customer_info: {
        name: 'Linda Thompson',
        email: 'linda.t@email.com',
        phone: '+1-555-0987'
      }
    }
  }
]

export const communicationScenarios = [
  {
    id: 'claim-acknowledgment',
    title: 'Claim Acknowledgment',
    description: 'Initial response confirming claim receipt',
    type: 'email',
    languages: ['en', 'es', 'fr'],
    context: {
      claim_id: 'CLM-2024-001',
      customer_name: 'John Smith',
      policy_number: 'AUTO-2024-001234'
    }
  },
  {
    id: 'document-request',
    title: 'Document Request',
    description: 'Request for additional documentation',
    type: 'email',
    languages: ['en', 'es'],
    context: {
      claim_id: 'CLM-2024-002',
      customer_name: 'Sarah Johnson',
      required_docs: ['Police report', 'Repair estimates', 'Photos']
    }
  },
  {
    id: 'claim-approval',
    title: 'Claim Approval Notice',
    description: 'Notification of claim approval and next steps',
    type: 'email',
    languages: ['en', 'fr'],
    context: {
      claim_id: 'CLM-2024-003',
      customer_name: 'Michael Chen',
      settlement_amount: 15000
    }
  },
  {
    id: 'status-update',
    title: 'Status Update SMS',
    description: 'Brief status update via text message',
    type: 'sms',
    languages: ['en', 'es'],
    context: {
      claim_id: 'CLM-2024-004',
      customer_name: 'Emily Rodriguez',
      current_status: 'Under review'
    }
  }
]

export const workflowScenarios = [
  {
    id: 'standard-auto-claim',
    title: 'Standard Auto Claim Processing',
    description: 'Typical auto claim workflow with assessment and communication',
    type: 'auto_claim_standard',
    priority: 'medium',
    steps: ['intake', 'assessment', 'communication', 'settlement']
  },
  {
    id: 'complex-investigation',
    title: 'Complex Claim Investigation',
    description: 'High-value claim requiring detailed investigation and multiple agent coordination',
    type: 'complex_investigation',
    priority: 'high',
    steps: ['intake', 'preliminary_assessment', 'investigation', 'expert_review', 'communication', 'settlement']
  },
  {
    id: 'expedited-processing',
    title: 'Expedited Claim Processing',
    description: 'Fast-track processing for simple, clear-cut claims',
    type: 'expedited',
    priority: 'high',
    steps: ['intake', 'quick_assessment', 'auto_approval', 'communication']
  },
  {
    id: 'multi-party-coordination',
    title: 'Multi-Party Coordination',
    description: 'Complex scenario involving multiple parties and agents',
    type: 'multi_party',
    priority: 'high',
    steps: ['intake', 'party_identification', 'parallel_assessment', 'coordination', 'communication', 'settlement']
  }
]

export function getScenarioById(id: string): DemoScenario | undefined {
  return demoScenarios.find(scenario => scenario.id === id)
}

export function getScenariosByCategory(category: DemoScenario['category']): DemoScenario[] {
  return demoScenarios.filter(scenario => scenario.category === category)
}

export function getScenariosByComplexity(complexity: DemoScenario['complexity']): DemoScenario[] {
  return demoScenarios.filter(scenario => scenario.complexity === complexity)
} 