import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
import random

class EducationalVectorBot:
    def __init__(self, vector_store_path):
        self.vector_store_path = vector_store_path
        self.vectorizer = None
        self.responses = []
        self.questions = []
        self.load_vector_store()
        
    def load_vector_store(self):
        try:
            # Try to load the existing vector store
            with open(self.vector_store_path, 'rb') as f:
                data = pickle.load(f)
                
            # Handle different possible formats
            if isinstance(data, dict):
                self.vectorizer = data.get('vectorizer')
                self.responses = data.get('responses', [])
                self.questions = data.get('questions', [])
            elif isinstance(data, tuple):
                self.vectorizer, self.responses, self.questions = data
            else:
                # If it's a different format, create educational fallback
                self.create_educational_responses()
                
        except Exception as e:
            print(f"Error loading vector store: {e}")
            self.create_educational_responses()
    
    def create_educational_responses(self):
        """Create educational response system for various subjects"""
        self.questions = [
            # Mathematics
            "what are quadratic equations",
            "explain algebra basics",
            "how to solve linear equations",
            "what is calculus",
            "explain derivatives",
            "what are integrals",
            "geometry formulas",
            "trigonometry basics",
            "statistics concepts",
            "probability theory",
            
            # Physics & Electronics
            "what is Newton's law",
            "explain motion and force",
            "what is electricity",
            "magnetic fields explained",
            "thermodynamics concepts",
            "wave properties",
            "atomic structure",
            "quantum physics basics",
            "optics and light",
            "energy conservation",
            "electronics basics",
            "learn electronics",
            "electronic circuits",
            "semiconductors and diodes",
            "transistors and amplifiers",
            "digital electronics",
            "analog electronics",
            "electronic components",
            "circuit analysis",
            "electrical engineering basics",
            
            # Chemistry
            "periodic table elements",
            "chemical bonding types",
            "organic chemistry basics",
            "acid and base reactions",
            "chemical equations balancing",
            "molecular structure",
            "electrochemistry concepts",
            "reaction mechanisms",
            "stoichiometry calculations",
            "chemical thermodynamics",
            
            # Biology
            "cell structure and function",
            "photosynthesis process",
            "cellular respiration",
            "genetics and DNA",
            "evolution theory",
            "human body systems",
            "ecology concepts",
            "plant biology",
            "animal behavior",
            "microbiology basics",
            
            # Computer Science & Web Development
            "what are algorithms",
            "data structures explained",
            "programming concepts",
            "object oriented programming",
            "database fundamentals",
            "network protocols",
            "software engineering",
            "artificial intelligence basics",
            "machine learning concepts",
            "cybersecurity principles",
            "cyber security basics",
            "learn cybersecurity",
            "information security",
            "network security fundamentals",
            "computer security basics",
            "cybersecurity concepts",
            "security threats and protection",
            "HTML basics and structure",
            "CSS styling fundamentals",
            "JavaScript programming",
            "web development basics",
            "HTML tags and elements",
            "responsive web design",
            "frontend development",
            "backend development",
            "web programming languages",
            "how to learn HTML",
            
            # English/Literature & Grammar
            "grammar rules and basics",
            "basic grammar help",
            "learn grammar",
            "grammar fundamentals",
            "english grammar basics", 
            "want to learn english",
            "learn english language",
            "english language basics",
            "parts of speech explained",
            "sentence structure rules",
            "punctuation and capitalization",
            "verb tenses and usage",
            "noun and pronoun rules",
            "adjective and adverb usage",
            "subject verb agreement",
            "essay writing tips",
            "poetry analysis",
            "literature themes",
            "reading comprehension",
            "vocabulary building",
            "writing techniques",
            "literary devices",
            "communication skills",
            "critical thinking",
            "paragraph writing",
            "thesis statement writing",
            "grammar common mistakes",
            
            # History
            "world war events",
            "ancient civilizations",
            "historical timeline",
            "cultural movements",
            "political systems",
            "economic history",
            "social changes",
            "historical figures",
            "revolution causes",
            "historical analysis",
            
            # General Study
            "study techniques",
            "time management",
            "exam preparation",
            "note taking methods",
            "research skills",
            "memory techniques",
            "learning strategies",
            "academic writing",
            "presentation skills",
            "critical analysis"
        ]
        
        self.responses = [
            # Mathematics
            "Quadratic equations are polynomial equations of degree 2, typically in the form ax² + bx + c = 0. They can be solved using the quadratic formula: x = (-b ± √(b²-4ac))/2a. These equations appear in many real-world applications like projectile motion and optimization problems.",
            "Algebra is the branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations. Basic concepts include variables, coefficients, expressions, and solving for unknown values. It's fundamental for advanced mathematics.",
            "Linear equations are equations where variables appear to the first power only. To solve them: 1) Isolate the variable on one side, 2) Perform the same operations on both sides, 3) Simplify step by step. Example: 2x + 5 = 11 → 2x = 6 → x = 3.",
            "Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (derivatives - rates of change) and integral calculus (integrals - accumulation of quantities). It's essential for physics, engineering, and economics.",
            "Derivatives measure how a function changes as its input changes - essentially the rate of change or slope. The derivative of f(x) at point x is written as f'(x) or df/dx. Basic rules include power rule, product rule, quotient rule, and chain rule.",
            "Integrals are the reverse of derivatives, representing the accumulation of quantities. Definite integrals calculate area under curves, while indefinite integrals find antiderivatives. The fundamental theorem of calculus connects derivatives and integrals.",
            "Key geometry formulas include: Area of circle = πr², Triangle area = ½bh, Rectangle area = lw, Volume of sphere = (4/3)πr³, Pythagorean theorem: a² + b² = c². These formulas help solve spatial problems.",
            "Trigonometry studies relationships between angles and sides in triangles. Key functions are sine (opposite/hypotenuse), cosine (adjacent/hypotenuse), and tangent (opposite/adjacent). Unit circle and trigonometric identities are fundamental concepts.",
            "Statistics involves collecting, analyzing, and interpreting data. Key concepts include mean, median, mode, standard deviation, correlation, and probability distributions. It helps make informed decisions based on data analysis.",
            "Probability theory deals with the likelihood of events occurring. Basic concepts include sample space, events, conditional probability, and probability distributions. It's used in statistics, science, and everyday decision-making.",
            
            # Physics & Electronics
            "Newton's laws of motion: 1) An object at rest stays at rest unless acted upon by force, 2) Force equals mass times acceleration (F=ma), 3) For every action, there's an equal and opposite reaction. These laws describe the relationship between forces and motion.",
            "Motion is the change in position over time, described by displacement, velocity, and acceleration. Force is a push or pull that can change an object's motion. The relationship between force and motion is governed by Newton's laws.",
            "Electricity is the flow of electric charge through conductors. Key concepts include voltage (potential difference), current (flow of charge), resistance (opposition to flow), and Ohm's law (V=IR). It powers our modern world.",
            "Magnetic fields are invisible forces around magnets and moving electric charges. They can attract or repel magnetic materials and are related to electric fields through electromagnetic induction. Earth itself has a magnetic field.",
            "Thermodynamics studies heat, work, and energy transfer. Key laws include conservation of energy, entropy increase, and absolute zero temperature. It explains engines, refrigerators, and energy conversion processes.",
            "Waves are disturbances that transfer energy without transferring matter. Properties include wavelength, frequency, amplitude, and speed. Types include sound waves, light waves, and water waves. They exhibit reflection, refraction, and interference.",
            "Atoms consist of protons and neutrons in the nucleus, with electrons orbiting around. Protons are positive, electrons negative, neutrons neutral. The number of protons determines the element. Atoms combine to form molecules.",
            "Quantum physics describes the behavior of matter and energy at atomic and subatomic scales. Key concepts include wave-particle duality, uncertainty principle, and quantized energy levels. It's fundamental to modern technology.",
            "Optics studies light behavior including reflection, refraction, diffraction, and interference. Light exhibits both wave and particle properties. Applications include lenses, mirrors, lasers, and optical instruments.",
            "Energy cannot be created or destroyed, only transformed from one form to another (conservation of energy). Types include kinetic, potential, thermal, chemical, and nuclear energy. This principle governs all physical processes.",
            "Electronics is the study of circuits and devices that control electric current flow. It involves components like resistors, capacitors, inductors, diodes, and transistors. Electronics form the basis of computers, smartphones, and modern technology.",
            "Learning electronics starts with understanding basic components and Ohm's law (V=IR). Study resistors, capacitors, diodes, and transistors. Practice with simple circuits, breadboards, and multimeters. Build projects to gain hands-on experience.",
            "Electronic circuits are pathways for electric current, made of components like resistors, capacitors, and semiconductors. Types include series and parallel circuits, AC and DC circuits. Understanding circuit analysis is fundamental to electronics.",
            "Semiconductors like silicon have electrical properties between conductors and insulators. Diodes allow current flow in one direction only, used for rectification and voltage regulation. They're building blocks of modern electronics.",
            "Transistors are semiconductor devices that can amplify signals or act as switches. Types include BJT and FET. Amplifiers increase signal strength while maintaining the original waveform shape. They're essential in audio systems and electronics.",
            "Digital electronics uses discrete signals (0s and 1s) to process information. Key concepts include binary numbers, logic gates (AND, OR, NOT), flip-flops, and counters. It's the foundation of computers and digital systems.",
            "Analog electronics deals with continuous signals that can vary smoothly over time. Examples include audio signals, sensor outputs, and radio waves. Analog circuits process these signals using amplifiers, filters, and oscillators.",
            "Electronic components include passive elements (resistors, capacitors, inductors) and active elements (transistors, diodes, ICs). Each has specific functions: resistors limit current, capacitors store charge, inductors store magnetic energy.",
            "Circuit analysis involves calculating voltages, currents, and power in electronic circuits. Key methods include Ohm's law, Kirchhoff's laws, and network theorems. Understanding these helps design and troubleshoot electronic systems.",
            "Electrical engineering basics cover circuit theory, electronics, power systems, and control systems. It includes both AC and DC analysis, electromagnetic theory, and digital systems. It's the foundation for many modern technologies.",
            
            # Chemistry
            "The periodic table organizes elements by atomic number (number of protons). Elements in the same column have similar properties. Key groups include metals, nonmetals, and metalloids. It predicts chemical behavior and properties.",
            "Chemical bonds hold atoms together in compounds. Types include ionic (electron transfer), covalent (electron sharing), and metallic bonds. Bond strength and type determine molecular properties and behavior.",
            "Organic chemistry studies carbon-containing compounds. Carbon forms four bonds and can create chains, rings, and complex structures. Key concepts include hydrocarbons, functional groups, and reaction mechanisms.",
            "Acids release hydrogen ions (H+) in solution, while bases release hydroxide ions (OH-). pH measures acidity/basicity on a 0-14 scale. Neutralization reactions occur when acids and bases react to form salt and water.",
            "Chemical equations show reactants converting to products. Balancing equations ensures equal atoms on both sides, following conservation of mass. Coefficients indicate the number of molecules or moles involved.",
            "Molecular structure determines chemical properties. It includes molecular geometry, bond angles, and electron distribution. VSEPR theory predicts molecular shapes based on electron pair repulsion.",
            "Electrochemistry studies chemical reactions involving electron transfer. Key concepts include oxidation (loss of electrons), reduction (gain of electrons), and electrochemical cells like batteries and fuel cells.",
            "Reaction mechanisms describe the step-by-step process of chemical reactions. They explain how bonds break and form, intermediate species, and energy changes throughout the reaction pathway.",
            "Stoichiometry involves calculating quantities in chemical reactions using mole ratios from balanced equations. It helps determine reactant amounts needed and products formed in chemical processes.",
            "Chemical thermodynamics studies energy changes in reactions. Key concepts include enthalpy, entropy, and Gibbs free energy, which determine if reactions are spontaneous and favorable.",
            
            # Biology
            "Cells are the basic units of life. Prokaryotic cells (bacteria) lack a nucleus, while eukaryotic cells have membrane-bound organelles including nucleus, mitochondria, and others. Cell membrane controls what enters and exits.",
            "Photosynthesis converts light energy into chemical energy in plants. The process uses CO₂ and water to produce glucose and oxygen, occurring in chloroplasts. Equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.",
            "Cellular respiration breaks down glucose to release energy (ATP) for cellular processes. It occurs in mitochondria and includes glycolysis, Krebs cycle, and electron transport chain. It's essentially reverse of photosynthesis.",
            "Genetics studies heredity and DNA. DNA contains genetic instructions in sequences of four bases (A, T, G, C). Genes are DNA segments coding for traits. Inheritance follows Mendel's laws of segregation and independent assortment.",
            "Evolution explains how species change over time through natural selection. Key concepts include variation, inheritance, selection pressure, and adaptation. Evidence includes fossils, comparative anatomy, and molecular biology.",
            "Human body systems work together for survival: circulatory (heart, blood), respiratory (lungs), digestive (stomach, intestines), nervous (brain, nerves), and others. Homeostasis maintains internal balance.",
            "Ecology studies interactions between organisms and their environment. Key concepts include food chains, energy flow, nutrient cycles, and ecosystem balance. It helps understand environmental issues and conservation.",
            "Plant biology covers plant structure and function. Key processes include photosynthesis, transpiration, and reproduction. Plants have roots, stems, leaves, and specialized tissues for transport and support.",
            "Animal behavior includes innate and learned behaviors. Animals communicate, find food, reproduce, and survive through various behavioral adaptations. Ethology studies these behaviors scientifically.",
            "Microbiology studies microscopic organisms including bacteria, viruses, fungi, and protists. These organisms play crucial roles in ecosystems, disease, and biotechnology applications.",
            
            # Computer Science & Web Development
            "Algorithms are step-by-step procedures for solving problems. They must be precise, finite, and effective. Key concepts include time complexity, space complexity, and algorithmic thinking for efficient problem-solving.",
            "Data structures organize and store data efficiently. Common types include arrays, linked lists, stacks, queues, trees, and graphs. Choice of data structure affects program performance and memory usage.",
            "Programming concepts include variables, data types, control structures (loops, conditionals), functions, and modular design. Good programming practices include code readability, testing, and documentation.",
            "Object-oriented programming (OOP) organizes code into objects with properties and methods. Key principles include encapsulation, inheritance, polymorphism, and abstraction. It promotes code reusability and maintainability.",
            "Database fundamentals include data modeling, normalization, SQL queries, and CRUD operations. Databases store, organize, and retrieve information efficiently for applications and systems.",
            "Network protocols define rules for communication between devices. Examples include HTTP for web, TCP/IP for internet, and WiFi for wireless. Understanding networks is crucial for distributed systems.",
            "Software engineering involves systematic approaches to software development including requirements analysis, design, implementation, testing, and maintenance. It ensures reliable, maintainable software systems.",
            "Artificial intelligence involves creating systems that can perform tasks requiring human intelligence. Areas include machine learning, natural language processing, computer vision, and robotics.",
            "Machine learning enables computers to learn from data without explicit programming. Types include supervised, unsupervised, and reinforcement learning. It's used in recommendations, recognition, and prediction.",
            "Cybersecurity protects digital systems from threats. Key concepts include encryption, authentication, firewalls, and security protocols. It's essential as our world becomes increasingly digital.",
            "Cyber security (or cybersecurity) focuses on protecting computers, networks, and data from digital attacks. Core areas include network security, information security, application security, and operational security. It's a growing field with many career opportunities.",
            "Learning cybersecurity involves understanding threats like malware, phishing, and hacking, plus protective measures like firewalls, encryption, and secure coding. Start with basic concepts, then explore specialized areas like ethical hacking or digital forensics.",
            "Information security protects data confidentiality, integrity, and availability. Key principles include access control, encryption, backup systems, and incident response. It covers both digital and physical security measures.",
            "Network security fundamentals include firewalls, intrusion detection systems, VPNs, and secure network protocols. Learn about common attacks like DDoS, man-in-the-middle, and packet sniffing, plus how to defend against them.",
            "Computer security basics cover antivirus software, secure passwords, system updates, and safe browsing habits. Understand malware types, social engineering attacks, and basic security best practices for personal and professional use.",
            "Cybersecurity concepts include threat modeling, risk assessment, security policies, and incident response. Study the CIA triad (Confidentiality, Integrity, Availability) and defense-in-depth strategies for comprehensive protection.",
            "Security threats include malware, phishing, ransomware, and social engineering. Protection methods involve firewalls, antivirus software, employee training, and security policies. Stay updated on emerging threats and countermeasures.",
            "HTML (HyperText Markup Language) is the foundation of web pages. It uses elements like <h1>, <p>, <div>, and <a> to structure content. Start with basic tags: <!DOCTYPE html>, <html>, <head>, <body>. Practice creating simple pages with headings, paragraphs, and links.",
            "CSS (Cascading Style Sheets) controls the visual appearance of HTML elements. It uses selectors, properties, and values to style web pages. Learn about colors, fonts, layouts, and responsive design. CSS makes websites visually appealing and user-friendly.",
            "JavaScript is a programming language that adds interactivity to web pages. It can manipulate HTML elements, handle user events, and create dynamic content. Start with variables, functions, and DOM manipulation.",
            "Web development involves creating websites and web applications. Frontend focuses on user interface (HTML, CSS, JavaScript), while backend handles server logic and databases. It's a creative and practical skill.",
            "HTML tags are the building blocks of web pages. Common tags include <h1>-<h6> for headings, <p> for paragraphs, <img> for images, <a> for links, and <div> for containers. Each tag has a specific purpose and attributes.",
            "Responsive web design ensures websites work on all devices. Use CSS media queries, flexible layouts, and relative units. Mobile-first approach is recommended. Test on different screen sizes for best user experience.",
            "Frontend development focuses on user interface and user experience. Technologies include HTML for structure, CSS for styling, and JavaScript for interactivity. Popular frameworks include React, Vue, and Angular.",
            "Backend development handles server-side logic, databases, and APIs. Languages include Python, JavaScript (Node.js), Java, and PHP. It manages data storage, user authentication, and business logic.",
            "Web programming languages each serve different purposes: HTML for structure, CSS for styling, JavaScript for interactivity, Python/PHP/Node.js for backend, and SQL for databases. Choose based on your goals.",
            "To learn HTML: Start with basic structure, practice with simple pages, use online resources like MDN or W3Schools, build small projects, and gradually add CSS and JavaScript. Consistency and practice are key.",
            
            # English/Literature & Grammar
            "Grammar rules govern language structure. Key components include parts of speech (nouns, verbs, adjectives), sentence structure (subject-predicate), and punctuation. Good grammar ensures clear communication and professional writing.",
            "Grammar basics include understanding parts of speech, sentence structure, and punctuation rules. Start with nouns, verbs, and adjectives, then learn how to combine them into clear, correct sentences. Practice regularly with simple exercises.",
            "Learning grammar starts with understanding the building blocks: nouns (people, places, things), verbs (actions), adjectives (descriptive words), and how they work together. Focus on one concept at a time and practice with examples.",
            "Grammar fundamentals include parts of speech, sentence structure, verb tenses, and punctuation. Master these basics first: subjects and predicates, proper comma usage, and common verb forms. Good grammar improves all communication.",
            "English grammar covers parts of speech, sentence types, punctuation, and usage rules. Start with basic sentence structure (subject + verb + object), learn common punctuation marks, and practice identifying different word types in sentences.",
            "English language learning involves grammar, vocabulary, reading, writing, and speaking skills. Start with basic sentence patterns, common vocabulary, and simple conversations. Practice daily and don't be afraid to make mistakes - they help you learn!",
            "English language basics include alphabet, pronunciation, basic vocabulary, and simple sentence structure. Focus on common words, everyday phrases, and basic grammar rules. Immerse yourself in the language through reading, listening, and speaking practice.",
            "English fundamentals cover reading, writing, speaking, and listening skills. Build vocabulary through reading, practice grammar through writing, and improve pronunciation through speaking. Consistency and patience are key to language learning success.",
            "Parts of speech are word categories: nouns (people, places, things), verbs (actions, states), adjectives (descriptive words), adverbs (modify verbs/adjectives), pronouns (replace nouns), prepositions (show relationships), conjunctions (connect words/phrases), and interjections (express emotion).",
            "Sentence structure follows patterns. Simple sentences have one clause (subject + predicate). Compound sentences join independent clauses with conjunctions. Complex sentences combine independent and dependent clauses. Variety improves writing flow.",
            "Punctuation and capitalization rules: Periods end statements, commas separate items/clauses, semicolons join related sentences, apostrophes show possession/contractions. Capitalize proper nouns, sentence beginnings, and titles. Consistent punctuation aids readability.",
            "Verb tenses show when actions occur: past (happened before), present (happening now), future (will happen). Each has simple, continuous, perfect, and perfect continuous forms. Correct tense usage clarifies timing and relationships between events.",
            "Nouns name people, places, things, or ideas. Types include common (general), proper (specific names), concrete (tangible), abstract (concepts), collective (groups). Pronouns replace nouns to avoid repetition: he, she, it, they, this, that.",
            "Adjectives describe nouns (big house, red car), while adverbs modify verbs, adjectives, or other adverbs (runs quickly, very tall). They add detail and precision to writing. Place them close to the words they modify.",
            "Subject-verb agreement means subjects and verbs must match in number. Singular subjects take singular verbs (cat runs), plural subjects take plural verbs (cats run). Watch for tricky cases like collective nouns and compound subjects.",
            "Essay writing involves thesis development, structured arguments, evidence support, and clear conclusions. Key components include introduction, body paragraphs, and conclusion with logical flow throughout.",
            "Poetry analysis examines literary devices like metaphor, simile, rhythm, rhyme, and imagery. Consider the poet's purpose, themes, and emotional impact. Context and historical background enhance understanding.",
            "Literature themes explore universal human experiences like love, conflict, identity, and social issues. Themes provide deeper meaning beyond surface plot and connect readers to broader human conditions.",
            "Reading comprehension involves understanding, analyzing, and interpreting written text. Strategies include active reading, note-taking, questioning, and connecting ideas to prior knowledge.",
            "Vocabulary building enhances communication and comprehension. Techniques include reading widely, using context clues, studying word roots, and active practice. Strong vocabulary improves all language skills.",
            "Writing techniques include showing vs. telling, varied sentence structure, active voice, and clear organization. Good writing engages readers through vivid descriptions and compelling narratives.",
            "Literary devices enhance meaning and impact in writing. Examples include symbolism, irony, foreshadowing, and allegory. These tools help authors convey complex ideas and emotions effectively.",
            "Communication skills include listening, speaking, writing, and nonverbal communication. Effective communication requires clarity, empathy, and adaptation to audience and context.",
            "Critical thinking involves analyzing, evaluating, and synthesizing information to form reasoned judgments. It includes questioning assumptions, considering evidence, and recognizing bias and logical fallacies.",
            "Paragraph writing requires a clear topic sentence, supporting details, and concluding sentence. Each paragraph should focus on one main idea. Use transitions to connect paragraphs and maintain flow throughout your writing.",
            "Thesis statement writing involves creating a clear, specific claim that guides your entire essay. It should be arguable, focused, and appear in your introduction. A strong thesis tells readers exactly what to expect from your paper.",
            "Common grammar mistakes include run-on sentences, sentence fragments, misplaced modifiers, and incorrect pronoun usage. Proofread carefully, read aloud, and use grammar tools. Practice identifying and correcting these errors improves writing quality.",
            
            # History
            "World wars were global conflicts that reshaped the 20th century. WWI (1914-1918) involved trench warfare and new technologies. WWII (1939-1945) included the Holocaust and ended with nuclear weapons.",
            "Ancient civilizations like Mesopotamia, Egypt, Greece, and Rome laid foundations for modern society. They developed writing, laws, architecture, and governmental systems that influence us today.",
            "Historical timelines help organize events chronologically. Key periods include prehistoric, ancient, medieval, renaissance, industrial revolution, and modern eras. Understanding sequence aids comprehension.",
            "Cultural movements like Renaissance, Enlightenment, and Romanticism shaped art, literature, and thought. They reflect changing values, beliefs, and social conditions of their times.",
            "Political systems include democracy, monarchy, republic, and dictatorship. Each has different power structures, decision-making processes, and citizen roles. Understanding these helps analyze historical events.",
            "Economic history examines how societies produced, distributed, and consumed goods. Major developments include agriculture, trade, industrialization, and modern global economy.",
            "Social changes include shifts in class structure, gender roles, racial relations, and cultural norms. These changes often drive historical events and reflect evolving human values.",
            "Historical figures like leaders, innovators, and reformers shape events through their actions and decisions. Studying individuals helps understand broader historical forces and changes.",
            "Revolutions occur when people overthrow existing systems. Common causes include economic hardship, political oppression, and social inequality. Examples include American, French, and Russian revolutions.",
            "Historical analysis involves examining sources, considering multiple perspectives, and understanding cause-and-effect relationships. It requires critical thinking and awareness of bias and context.",
            
            # General Study
            "Effective study techniques include active reading, spaced repetition, practice testing, and elaborative interrogation. Different techniques work better for different subjects and learning styles.",
            "Time management involves prioritizing tasks, setting goals, avoiding procrastination, and using tools like schedules and planners. Good time management reduces stress and improves productivity.",
            "Exam preparation includes reviewing material systematically, practicing problems, creating study guides, and getting enough sleep. Start early and use active learning techniques for best results.",
            "Note-taking methods include Cornell notes, outline format, mind mapping, and digital tools. Good notes capture key information, are organized, and help with review and retention.",
            "Research skills involve finding credible sources, evaluating information, and synthesizing findings. Use libraries, databases, and online resources while being aware of bias and reliability.",
            "Memory techniques include mnemonics, visualization, association, and chunking. These strategies help encode, store, and retrieve information more effectively for long-term learning.",
            "Learning strategies should match your learning style and the subject matter. Mix reading, writing, listening, and hands-on activities. Regular review and practice strengthen understanding.",
            "Academic writing requires clear thesis, logical organization, evidence support, and proper citations. It follows specific formats and conventions while maintaining objectivity and scholarly tone.",
            "Presentation skills include organizing content, engaging audience, using visual aids, and managing nerves. Practice, preparation, and audience awareness are key to effective presentations.",
            "Critical analysis involves breaking down complex information, examining evidence, identifying assumptions, and evaluating arguments. It's essential for academic success and informed decision-making."
        ]
        
        # Create a simple vectorizer for these responses
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True, ngram_range=(1, 2))
        self.vectorizer.fit(self.questions)
    
    def get_best_response(self, user_message):
        try:
            # Clean and preprocess the user message
            user_message = self.preprocess_text(user_message)
            
            # If message is too short, provide encouragement
            if len(user_message.split()) < 2:
                return self.get_encouragement_response()
            
            # Vectorize the user message
            user_vector = self.vectorizer.transform([user_message])
            
            # Vectorize all stored questions
            question_vectors = self.vectorizer.transform(self.questions)
            
            # Calculate similarity
            similarities = cosine_similarity(user_vector, question_vectors).flatten()
            
            # Get the most similar question index
            best_match_idx = np.argmax(similarities)
            similarity_score = similarities[best_match_idx]
            
            # If similarity is too low, provide a general educational response
            if similarity_score < 0.05:
                return self.get_general_educational_response(user_message)
            
            return self.responses[best_match_idx]
            
        except Exception as e:
            print(f"Error in get_best_response: {e}")
            return self.get_general_educational_response(user_message)
    
    def preprocess_text(self, text):
        """Clean and preprocess text"""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        return text.strip()
    
    def get_encouragement_response(self):
        """Provide encouraging response for short messages"""
        encouragement_responses = [
            "Hi there! I'm here to help you learn. What subject or topic would you like to explore today?",
            "Hello! Feel free to ask me about any academic topic - math, science, history, literature, or study tips!",
            "Welcome! I can help explain concepts across many subjects. What would you like to learn about?",
            "Great to see you! Ask me anything about your studies - I'm here to help you understand better.",
            "Hi! Whether it's homework help or exploring new topics, I'm ready to assist your learning journey."
        ]
        return random.choice(encouragement_responses)
    
    def get_general_educational_response(self, user_message):
        """Provide educational guidance when no specific match is found"""
        
        # Check for subject keywords
        subjects = {
            'math': "Mathematics is a fascinating subject! I can help with algebra, geometry, calculus, statistics, and more. What specific math topic interests you?",
            'science': "Science explores our natural world! I can discuss physics, chemistry, biology, or earth science. Which area would you like to learn about?",
            'electronics': "Electronics is fascinating! I can help with basic components, circuit analysis, semiconductors, digital/analog electronics, and practical projects. What aspect of electronics interests you?",
            'history': "History helps us understand our past and present. I can discuss world history, specific time periods, or historical analysis methods. What interests you?",
            'english': "English and literature develop communication skills. I can help with grammar, writing, reading comprehension, or literary analysis. What would you like to work on?",
            'grammar': "Grammar is essential for clear communication! I can help with parts of speech, sentence structure, verb tenses, punctuation, and common grammar mistakes. What specific grammar topic would you like to learn?",
            'html': "HTML is the foundation of web development! I can help you learn basic tags, document structure, forms, and best practices. Would you like to start with basic HTML structure or specific elements?",
            'web': "Web development is an exciting field! I can help with HTML for structure, CSS for styling, JavaScript for interactivity, and general web development concepts. What aspect interests you most?",
            'css': "CSS controls the visual styling of web pages! I can help with selectors, properties, layouts, responsive design, and modern CSS techniques. What would you like to learn about CSS?",
            'javascript': "JavaScript adds interactivity to web pages! I can help with variables, functions, DOM manipulation, events, and modern JavaScript features. What JavaScript topic interests you?",
            'computer': "Computer science is an exciting field! I can explain programming, algorithms, data structures, web development, or technology concepts. What aspect interests you?",
            'programming': "Programming is a valuable skill! I can help with fundamental concepts, different languages, problem-solving approaches, and best practices. What programming topic would you like to explore?",
            'cybersecurity': "Cybersecurity is a crucial field protecting our digital world! I can help with security concepts, threat types, protection methods, ethical hacking, and career paths. What aspect of cybersecurity interests you most?",
            'study': "Good study habits are key to academic success! I can share techniques for note-taking, time management, exam preparation, and effective learning strategies."
        }
        
        user_lower = user_message.lower()
        for subject, response in subjects.items():
            if subject in user_lower:
                return response
        
        # General educational responses
        general_responses = [
            "That's an interesting question! While I may not have specific information on that topic, I'd be happy to help you think through it. Can you provide more context or break it down into smaller parts?",
            "I can see you're curious about learning! For the best help, try asking about specific subjects like math, science, history, English, or study techniques. What area interests you most?",
            "Learning is a journey, and I'm here to support you! If you're looking for help with a particular subject or concept, feel free to be more specific. What would you like to understand better?",
            "Great question! To give you the most helpful response, could you tell me more about what subject this relates to? I can assist with various academic topics and study strategies.",
            "I appreciate your curiosity! For academic topics, I can provide explanations, examples, and study tips. What specific area of learning can I help you with today?"
        ]
        return random.choice(general_responses)

    def analyze_subject_area(self, user_message):
        """Analyze which subject area the user is asking about"""
        subject_keywords = {
            'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'formula', 'number', 'calculate'],
            'physics': ['physics', 'force', 'energy', 'motion', 'electricity', 'magnetism', 'wave', 'atom'],
            'electronics': ['electronics', 'electronic', 'circuit', 'transistor', 'diode', 'semiconductor', 'amplifier'],
            'chemistry': ['chemistry', 'element', 'molecule', 'reaction', 'acid', 'base', 'bond', 'periodic'],
            'biology': ['biology', 'cell', 'dna', 'evolution', 'plant', 'animal', 'organism', 'genetics'],
            'computer_science': ['programming', 'algorithm', 'computer', 'code', 'software', 'data', 'technology'],
            'cybersecurity': ['cybersecurity', 'cyber', 'security', 'hacking', 'firewall', 'encryption', 'malware', 'phishing'],
            'web_development': ['html', 'css', 'javascript', 'web', 'website', 'frontend', 'backend', 'responsive'],
            'english': ['english', 'writing', 'literature', 'essay', 'poetry', 'reading', 'vocabulary'],
            'grammar': ['grammar', 'punctuation', 'sentence', 'verb', 'noun', 'adjective', 'tense', 'spelling'],
            'history': ['history', 'historical', 'ancient', 'war', 'civilization', 'culture', 'timeline'],
            'study_skills': ['study', 'exam', 'test', 'learn', 'memory', 'note', 'homework', 'preparation']
        }
        
        user_lower = user_message.lower()
        subject_scores = {}
        
        for subject, keywords in subject_keywords.items():
            score = sum(1 for keyword in keywords if keyword in user_lower)
            if score > 0:
                subject_scores[subject] = score
        
        if subject_scores:
            return max(subject_scores, key=subject_scores.get)
        return 'general'
