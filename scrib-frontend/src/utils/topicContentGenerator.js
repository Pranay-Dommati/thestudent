/**
 * topicContentGenerator.js
 * Generates rich, non-generic descriptions and key concepts for topic landing pages
 * based on simple keyword matching heuristics.
 */

const DOMAIN_HEURISTICS = [
  {
    keywords: ['cloud', 'aws', 'azure', 'serverless', 'iaas', 'paas', 'saas'],
    category: 'Cloud Computing',
    generateOverview: (title) => `Handwritten revision notes covering core ${title.toLowerCase()} concepts including virtualization, service models, deployment architectures, and distributed systems.`,
    concepts: ['Virtualization', 'Scalability', 'Service Models (IaaS, PaaS, SaaS)', 'Distributed Systems'],
  },
  {
    keywords: ['dbms', 'sql', 'database', 'normalization', 'transaction'],
    category: 'Database Management',
    generateOverview: (title) => `Comprehensive handwritten notes for ${title.toLowerCase()}, detailing data modeling, query optimization, ACID properties, and relational algebra.`,
    concepts: ['Relational Algebra', 'ACID Properties', 'Normalization Forms', 'Query Optimization'],
  },
  {
    keywords: ['network', 'osi', 'tcp', 'ip', 'routing'],
    category: 'Computer Networks',
    generateOverview: (title) => `Exam-focused handwritten notes on ${title.toLowerCase()}, covering protocol stacks, data link controls, routing algorithms, and network security.`,
    concepts: ['OSI Model', 'TCP/IP Architecture', 'Routing Protocols', 'Congestion Control'],
  },
  {
    keywords: ['physics', 'ohm', 'kirchhoff', 'law', 'circuit', 'mechanics', 'thermo', 'optics'],
    category: 'Physics',
    generateOverview: (title) => `Detailed handwritten revision notes for ${title.toLowerCase()}, breaking down essential formulas, derivations, and theoretical principles for exam preparation.`,
    concepts: ['Formulas & Derivations', 'Theoretical Principles', 'Problem Solving Methods', 'Unit Analysis'],
  },
  {
    keywords: ['math', 'calculus', 'algebra', 'geometry', 'derivative', 'integral', 'equation'],
    category: 'Mathematics',
    generateOverview: (title) => `Step-by-step handwritten notes on ${title.toLowerCase()}, illustrating key theorems, proofs, and standard problem-solving techniques.`,
    concepts: ['Theorems & Proofs', 'Step-by-Step Examples', 'Standard Formulas', 'Graphical Analysis'],
  },
  {
    keywords: ['biology', 'cell', 'genetics', 'evolution', 'anatomy'],
    category: 'Biology',
    generateOverview: (title) => `Visual and detailed handwritten notes for ${title.toLowerCase()}, featuring labeled diagrams, process flows, and key biological definitions.`,
    concepts: ['Process Flows', 'Definitions & Terminology', 'Biological Systems', 'Comparative Analysis'],
  },
]

const DEFAULT_GENERATOR = {
  category: 'Academic Subject',
  generateOverview: (title) => `High-quality, handwritten exam notes for ${title}. Perfect for quick revision, grasping core concepts, and last-minute exam preparation.`,
  concepts: ['Core Principles', 'Important Definitions', 'Exam Questions', 'Quick Summaries'],
}

export const getTopicContent = (title) => {
  if (!title) return DEFAULT_GENERATOR
  
  const lowerTitle = title.toLowerCase()
  for (const heuristic of DOMAIN_HEURISTICS) {
    if (heuristic.keywords.some((kw) => lowerTitle.includes(kw))) {
      return {
        category: heuristic.category,
        overview: heuristic.generateOverview(title),
        concepts: heuristic.concepts,
      }
    }
  }

  return {
    category: DEFAULT_GENERATOR.category,
    overview: DEFAULT_GENERATOR.generateOverview(title),
    concepts: DEFAULT_GENERATOR.concepts,
  }
}
