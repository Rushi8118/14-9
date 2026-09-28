/**
 * Master Regional Coverage Dataset
 * Covers all 28 States and 8 Union Territories of India, plus
 * Bangladesh, Pakistan, Nepal, and Sri Lanka, mapped to top working destination countries.
 */

export interface RegionalLocation {
  name: string
  type: 'state' | 'ut' | 'country'
  country: 'India' | 'Bangladesh' | 'Pakistan' | 'Nepal' | 'Sri Lanka'
  capital?: string
  majorCities: string[]
  regionalHub: string // e.g., Regional Passport Office / VFS Global center location
  popularDestinations: string[]
  localDocumentNotes: string
  primaryKeywords: string[]
}

export const INDIAN_STATES_DATA: RegionalLocation[] = [
  {
    name: 'Gujarat',
    type: 'state',
    country: 'India',
    capital: 'Gandhinagar',
    majorCities: ['Surat (Head Office)', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Navsari', 'Anand', 'Mehsana', 'Vapi'],
    regionalHub: 'Surat Office (Pragti IT Park) / VFS Ahmedabad / RPO Ahmedabad & Surat',
    popularDestinations: ['United Kingdom', 'Canada', 'Australia', 'Germany', 'United States', 'New Zealand', 'Japan', 'Poland'],
    localDocumentNotes: 'Gujarat University / GTU transcript verification, Gujarat State Home Department apostille in Gandhinagar, Surat RPO clearance.',
    primaryKeywords: [
      'visa consultants in surat', 'visa consultant ahmedabad', 'study abroad consultants gujarat',
      'canada work visa from gujarat', 'uk student visa consultant surat', 'australia work visa agent vadodara',
      'germany job seeker visa rajkot', 'student to work visa transition surat',
    ],
  },
  {
    name: 'Punjab',
    type: 'state',
    country: 'India',
    capital: 'Chandigarh',
    majorCities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Moga'],
    regionalHub: 'VFS Chandigarh / VFS Jalandhar / RPO Chandigarh & Jalandhar',
    popularDestinations: ['Canada', 'United Kingdom', 'Australia', 'New Zealand', 'Germany', 'USA', 'Cyprus'],
    localDocumentNotes: 'PSEB / Panjab University / GNDU transcript verification, Punjab State Home Dept attestation, Chandigarh VFS biometrics.',
    primaryKeywords: [
      'visa consultant in punjab', 'canada study visa consultant jalandhar', 'uk skilled worker visa amritsar',
      'australia 485 to work visa punjab', 'study visa to work visa conversion punjab', 'ludhiana abroad job visa consultancy',
    ],
  },
  {
    name: 'Maharashtra',
    type: 'state',
    country: 'India',
    capital: 'Mumbai',
    majorCities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Kolhapur', 'Solapur', 'Navi Mumbai'],
    regionalHub: 'VFS Global Mumbai (BKC) / VFS Pune / RPO Mumbai & Pune',
    popularDestinations: ['United Kingdom', 'United States', 'Germany', 'Canada', 'Australia', 'Ireland', 'Singapore', 'Japan'],
    localDocumentNotes: 'Mumbai University / SPPU Pune document verification, Mantralaya Mumbai Home Department attestation, BKC biometrics.',
    primaryKeywords: [
      'visa consultants in mumbai', 'study abroad consultants pune', 'germany work visa consultant mumbai',
      'uk graduate visa to skilled worker switch pune', 'australia employer sponsored visa mumbai',
    ],
  },
  {
    name: 'Delhi NCR',
    type: 'ut',
    country: 'India',
    capital: 'New Delhi',
    majorCities: ['New Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Dwarka', 'South Delhi', 'Rohini'],
    regionalHub: 'VFS Global Shivaji Stadium Metro Station, New Delhi / MEA CPV Division Patiala House',
    popularDestinations: ['United Kingdom', 'Canada', 'United States', 'Germany', 'Australia', 'Ireland', 'France', 'UAE'],
    localDocumentNotes: 'Delhi University / IPU verification, MEA New Delhi direct Apostille, Embassy interview & biometrics hub.',
    primaryKeywords: [
      'visa consultants in delhi', 'study visa consultants gurgaon', 'uk skilled worker visa agents noida',
      'canada pgwp to pr consultancy delhi', 'overseas job consultancy new delhi',
    ],
  },
  {
    name: 'Karnataka',
    type: 'state',
    country: 'India',
    capital: 'Bengaluru',
    majorCities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Davangere', 'Manipal'],
    regionalHub: 'VFS Global Bengaluru (Gopalan Innovation Mall) / RPO Bengaluru',
    popularDestinations: ['Germany', 'United States', 'United Kingdom', 'Ireland', 'Australia', 'Canada', 'Netherlands', 'Singapore'],
    localDocumentNotes: 'VTU Belagavi / Bangalore University transcript verification, Karnataka Secretariat Home Dept authentication, Bengaluru VFS.',
    primaryKeywords: [
      'visa consultants in bangalore', 'germany eu blue card consultant bangalore', 'uk tech visa switch bangalore',
      'study abroad consultants karnataka', 'ireland critical skills visa consultant mangalore',
    ],
  },
  {
    name: 'Telangana',
    type: 'state',
    country: 'India',
    capital: 'Hyderabad',
    majorCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad'],
    regionalHub: 'VFS Global Hyderabad / US Consulate General Hyderabad / RPO Hyderabad',
    popularDestinations: ['United States', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'Ireland'],
    localDocumentNotes: 'JNTUH / Osmania University transcripts, Telangana Secretariat attestation, Hyderabad VFS centre.',
    primaryKeywords: [
      'visa consultants in hyderabad', 'us f1 to h1b transition hyderabad', 'uk student visa to work visa hyderabad',
      'australia permanent residency consultant hyderabad', 'study abroad consultancy telangana',
    ],
  },
  {
    name: 'Andhra Pradesh',
    type: 'state',
    country: 'India',
    capital: 'Amaravati',
    majorCities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada', 'Nellore', 'Kurnool', 'Rajahmundry'],
    regionalHub: 'VFS Vijayawada / VFS Visakhapatnam / RPO Visakhapatnam',
    popularDestinations: ['United States', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'New Zealand'],
    localDocumentNotes: 'Andhra University / JNTUK verification, AP State Secretariat attestation, Vijayawada biometrics.',
    primaryKeywords: [
      'visa consultants in vijayawada', 'study abroad consultants visakhapatnam', 'uk work visa agent guntur',
      'australia study to work visa andhra pradesh', 'overseas job visa consultancy tirupati',
    ],
  },
  {
    name: 'Tamil Nadu',
    type: 'state',
    country: 'India',
    capital: 'Chennai',
    majorCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore'],
    regionalHub: 'VFS Global Chennai / RPO Chennai / US Consulate Chennai',
    popularDestinations: ['United Kingdom', 'Germany', 'Singapore', 'Australia', 'Canada', 'United States', 'Malaysia', 'Japan'],
    localDocumentNotes: 'Anna University / University of Madras verification, TN Public Dept Secretariat attestation, Chennai VAC.',
    primaryKeywords: [
      'visa consultants in chennai', 'germany work permit consultant coimbatore', 'singapore work pass agent chennai',
      'uk skilled worker visa consultant tamil nadu', 'australia student visa to pr chennai',
    ],
  },
  {
    name: 'Kerala',
    type: 'state',
    country: 'India',
    capital: 'Thiruvananthapuram',
    majorCities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kottayam', 'Kannur', 'Palakkad'],
    regionalHub: 'VFS Global Kochi / VFS Thiruvananthapuram / RPO Kochi & Trivandrum / NORKA ROOTS',
    popularDestinations: ['United Kingdom', 'Germany', 'Ireland', 'Australia', 'Canada', 'Gulf (UAE, Saudi, Qatar)', 'Malta', 'New Zealand'],
    localDocumentNotes: 'Kerala University / KTU / Calicut University verification, NORKA ROOTS HRD authentication, Kochi VFS biometrics.',
    primaryKeywords: [
      'visa consultants in kochi', 'uk nurse and skilled worker visa kerala', 'germany opportunity card consultant trivandrum',
      'ireland work permit consultancy calicut', 'norka overseas job consultancy kerala',
    ],
  },
  {
    name: 'Haryana',
    type: 'state',
    country: 'India',
    capital: 'Chandigarh',
    majorCities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Kurukshetra'],
    regionalHub: 'VFS Chandigarh / VFS New Delhi / RPO Chandigarh & Delhi',
    popularDestinations: ['Canada', 'Australia', 'United Kingdom', 'Germany', 'United States', 'New Zealand', 'Poland'],
    localDocumentNotes: 'Kurukshetra University / MDU Rohtak verification, Haryana Home Dept attestation, New Delhi & Chandigarh submission.',
    primaryKeywords: [
      'visa consultants in haryana', 'canada study visa karnal', 'australia work visa agent kurukshetra',
      'uk work visa consultant panipat', 'ambala study abroad consultancy',
    ],
  },
  {
    name: 'Rajasthan',
    type: 'state',
    country: 'India',
    capital: 'Jaipur',
    majorCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'],
    regionalHub: 'VFS Global Jaipur / RPO Jaipur',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'United States', 'UAE', 'Singapore'],
    localDocumentNotes: 'Rajasthan University / RTU Kota verification, Government Secretariat Jaipur Home Dept attestation, Jaipur VFS.',
    primaryKeywords: [
      'visa consultants in jaipur', 'study abroad consultants jodhpur', 'canada work permit kota',
      'germany job seeker visa udaipur', 'uk student visa consultants rajasthan',
    ],
  },
  {
    name: 'Uttar Pradesh',
    type: 'state',
    country: 'India',
    capital: 'Lucknow',
    majorCities: ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur'],
    regionalHub: 'VFS Global Lucknow / VFS New Delhi / RPO Lucknow & Ghaziabad',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'United States', 'Gulf Countries', 'Japan'],
    localDocumentNotes: 'AKTU / Lucknow University / BHU verification, UP Secretariat Lucknow attestation, Lucknow & Delhi VAC.',
    primaryKeywords: [
      'visa consultants in lucknow', 'study visa consultants kanpur', 'uk skilled worker visa varanasi',
      'canada work visa agent agra', 'overseas education consultants uttar pradesh',
    ],
  },
  {
    name: 'West Bengal',
    type: 'state',
    country: 'India',
    capital: 'Kolkata',
    majorCities: ['Kolkata', 'Siliguri', 'Asansol', 'Durgapur', 'Howrah', 'Bardhaman', 'Kharagpur'],
    regionalHub: 'VFS Global Kolkata / US Consulate Kolkata / RPO Kolkata',
    popularDestinations: ['United Kingdom', 'Germany', 'Canada', 'Australia', 'United States', 'Ireland', 'France', 'Japan'],
    localDocumentNotes: 'Calcutta University / Jadavpur University / MAKAUT verification, Writers Building / Nabanna Home Dept attestation.',
    primaryKeywords: [
      'visa consultants in kolkata', 'germany study and work visa siliguri', 'uk student visa to work visa kolkata',
      'canada immigration consultancy west bengal', 'australia post study visa agent durgapur',
    ],
  },
  {
    name: 'Madhya Pradesh',
    type: 'state',
    country: 'India',
    capital: 'Bhopal',
    majorCities: ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam'],
    regionalHub: 'RPO Bhopal / VFS Global New Delhi & Mumbai',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'United States', 'Ireland'],
    localDocumentNotes: 'RGPV / DAVV Indore transcripts, Vallabh Bhawan Bhopal Home Dept authentication.',
    primaryKeywords: [
      'visa consultants in indore', 'study abroad consultants bhopal', 'germany work visa gwalior',
      'canada study visa jabalpur', 'uk work permit consultancy madhya pradesh',
    ],
  },
  {
    name: 'Bihar',
    type: 'state',
    country: 'India',
    capital: 'Patna',
    majorCities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Bihar Sharif'],
    regionalHub: 'RPO Patna / VFS Global Kolkata & New Delhi',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'Gulf Countries', 'Russia', 'Uzbekistan'],
    localDocumentNotes: 'Patna University / AKU verification, Old Secretariat Patna Home Dept attestation.',
    primaryKeywords: [
      'visa consultants in patna', 'study abroad consultants bihar', 'uk work permit agent gaya',
      'canada student visa muzaffarpur', 'gulf work visa consultancy patna',
    ],
  },
  {
    name: 'Odisha',
    type: 'state',
    country: 'India',
    capital: 'Bhubaneswar',
    majorCities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Berhampur', 'Balasore'],
    regionalHub: 'RPO Bhubaneswar / VFS Global Kolkata',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'USA', 'Singapore'],
    localDocumentNotes: 'Utkal University / BPUT verification, Home Dept Lok Seva Bhawan Bhubaneswar attestation.',
    primaryKeywords: [
      'visa consultants in bhubaneswar', 'study abroad consultants cuttack', 'uk work visa agent rourkela',
      'germany opportunity card odisha', 'canada visa consultancy bhubaneswar',
    ],
  },
  {
    name: 'Assam & North East',
    type: 'state',
    country: 'India',
    capital: 'Dispur / Guwahati',
    majorCities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur', 'Shillong', 'Imphal', 'Agartala', 'Aizawl', 'Kohima', 'Itanagar', 'Gangtok'],
    regionalHub: 'RPO Guwahati / VFS Global Kolkata / Branch VAC Guwahati',
    popularDestinations: ['United Kingdom', 'Australia', 'Canada', 'Germany', 'New Zealand', 'Singapore', 'Japan'],
    localDocumentNotes: 'Gauhati University / Assam University transcripts, Janata Bhawan Dispur Home Dept attestation.',
    primaryKeywords: [
      'visa consultants in guwahati', 'study abroad consultants assam', 'uk skilled worker visa north east india',
      'australia student visa dibrugarh', 'canada pgwp visa consultancy shillong',
    ],
  },
  {
    name: 'Goa',
    type: 'state',
    country: 'India',
    capital: 'Panaji',
    majorCities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    regionalHub: 'VFS Global Goa / RPO Panaji / Portuguese Consulate General Goa',
    popularDestinations: ['Portugal', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Gulf Countries'],
    localDocumentNotes: 'Goa University verification, Collectorate / Secretariat Panaji Home Dept attestation, Portuguese nationality guidance.',
    primaryKeywords: [
      'visa consultants in goa', 'portugal work visa panaji', 'uk work permit consultancy margao',
      'study abroad consultants goa', 'canada immigration agents goa',
    ],
  },
  {
    name: 'Himachal Pradesh & Uttarakhand',
    type: 'state',
    country: 'India',
    capital: 'Shimla & Dehradun',
    majorCities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Shimla', 'Dharamshala', 'Mandi', 'Solan'],
    regionalHub: 'RPO Dehradun & Shimla / VFS Global Chandigarh & New Delhi',
    popularDestinations: ['United Kingdom', 'Canada', 'Australia', 'Germany', 'New Zealand'],
    localDocumentNotes: 'HNB Garhwal / HPU Shimla verification, State Secretariat attestation, Chandigarh/Delhi submission.',
    primaryKeywords: [
      'visa consultants in dehradun', 'study abroad consultants shimla', 'canada visa consultancy haridwar',
      'uk student to work visa uttarakhand', 'australia work visa agent dharamshala',
    ],
  },
  {
    name: 'Jammu & Kashmir and Ladakh',
    type: 'ut',
    country: 'India',
    capital: 'Srinagar / Jammu / Leh',
    majorCities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Leh', 'Kargil', 'Udhampur'],
    regionalHub: 'RPO Srinagar & Jammu / VFS Global New Delhi',
    popularDestinations: ['United Kingdom', 'Germany', 'Turkey', 'Canada', 'Australia', 'Gulf Countries'],
    localDocumentNotes: 'Kashmir University / Jammu University verification, Civil Secretariat J&K Home Dept attestation.',
    primaryKeywords: [
      'visa consultants in srinagar', 'study abroad consultants jammu', 'uk student visa kashmir',
      'germany job seeker visa ladakh', 'canada work permit agents jammu',
    ],
  },
  {
    name: 'Jharkhand & Chhattisgarh',
    type: 'state',
    country: 'India',
    capital: 'Ranchi & Raipur',
    majorCities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Raipur', 'Bilaspur', 'Bhilai', 'Durg'],
    regionalHub: 'RPO Ranchi & Raipur / VFS Global Kolkata',
    popularDestinations: ['United Kingdom', 'Canada', 'Germany', 'Australia', 'USA'],
    localDocumentNotes: 'Ranchi University / Pt. Ravishankar Shukla University verification, State Home Dept authentication.',
    primaryKeywords: [
      'visa consultants in ranchi', 'study abroad consultants jamshedpur', 'canada visa agent raipur',
      'uk work visa consultancy bhilai', 'australia immigration agent dhanbad',
    ],
  },
]

export const SOUTH_ASIA_NEIGHBORS_DATA: RegionalLocation[] = [
  {
    name: 'Bangladesh',
    type: 'country',
    country: 'Bangladesh',
    capital: 'Dhaka',
    majorCities: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Comilla'],
    regionalHub: 'VFS Global Dhaka / BMET (Bureau of Manpower, Employment and Training) Kakrail / IOM Dhaka',
    popularDestinations: ['United Kingdom', 'Canada', 'Australia', 'Germany', 'Japan', 'Malaysia', 'Poland', 'Romania', 'Saudi Arabia'],
    localDocumentNotes: 'Board & Ministry of Education Dhaka attestation, MOFA Bangladesh apostille/attestation, BMET Smart Card clearance, IOM TB test certificate.',
    primaryKeywords: [
      'bangladesh to uk work visa', 'bangladesh to canada work permit', 'bmet registration foreign employment bangladesh',
      'uk student visa to skilled worker switch dhaka', 'australia study to work visa sylhet',
      'europe work visa for bangladeshi citizens', 'japan ssw visa bangladesh',
    ],
  },
  {
    name: 'Pakistan',
    type: 'country',
    country: 'Pakistan',
    capital: 'Islamabad',
    majorCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot'],
    regionalHub: 'Gerry’s Visa Islamabad & Lahore / Bureau of Emigration & Overseas Employment / MOFA Pakistan',
    popularDestinations: ['United Kingdom', 'Europe (Germany, Poland, Romania, Italy)', 'Canada', 'Australia', 'Gulf Countries', 'Malaysia', 'Japan'],
    localDocumentNotes: 'HEC degree attestation, IBCC certificate attestation, MOFA Pakistan attestation, Protector of Emigrants registration before departure.',
    primaryKeywords: [
      'pakistan to uk work visa', 'pakistan to europe work visa', 'protector of emigrants pakistan visa registration',
      'uk student visa expiring in london pakistani students', 'canada work permit from lahore',
      'germany opportunity card chancenkarte karachi', 'switch from student visa to work visa islamabad',
    ],
  },
  {
    name: 'Nepal',
    type: 'country',
    country: 'Nepal',
    capital: 'Kathmandu',
    majorCities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur', 'Birgunj', 'Dharan', 'Butwal'],
    regionalHub: 'VFS Global Kathmandu (Chhaya Center, Thamel) / Department of Foreign Employment (DoFE) Tahachal',
    popularDestinations: ['Australia', 'United Kingdom', 'Japan', 'Canada', 'New Zealand', 'Germany', 'Poland', 'Cyprus', 'UAE'],
    localDocumentNotes: 'Tribhuvan University / NEB verification, MOFA Nepal attestation, DoFE Labour Permit (Shram Swikriti), Police Clearance Certificate.',
    primaryKeywords: [
      'nepal to australia work visa', 'nepal to uk work visa', 'australia subclass 485 to work visa nepal students',
      'dofe labour permit foreign employment nepal', 'japan ssw visa for nepali',
      'canada work visa from kathmandu', 'uk student visa to skilled worker switch nepalese',
    ],
  },
  {
    name: 'Sri Lanka',
    type: 'country',
    country: 'Sri Lanka',
    capital: 'Colombo',
    majorCities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Kurunegala', 'Gampaha', 'Batticaloa'],
    regionalHub: 'VFS Global Colombo / Sri Lanka Bureau of Foreign Employment (SLBFE) Battaramulla / Consular Affairs Division MOFA',
    popularDestinations: ['Canada', 'United Kingdom', 'Australia', 'New Zealand', 'Japan', 'Italy', 'Germany', 'Singapore', 'UAE'],
    localDocumentNotes: 'UGC Sri Lanka degree authentication, MOFA Colombo consular attestation, SLBFE registration and insurance card before departure.',
    primaryKeywords: [
      'sri lanka to canada work visa', 'sri lanka to uk work visa', 'slbfe registration foreign employment',
      'australia post study work visa sri lanka students', 'canada lmia work permit from colombo',
      'uk graduate visa to skilled worker switch sri lankan', 'japan ssw visa sri lanka',
    ],
  },
]

export const ALL_REGIONAL_LOCATIONS = [...INDIAN_STATES_DATA, ...SOUTH_ASIA_NEIGHBORS_DATA]

export const TOP_WORKING_DESTINATIONS = [
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', visaRoutes: ['Skilled Worker Visa', 'Graduate Route Switch', 'Health & Care Worker', 'Global Talent'] },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', visaRoutes: ['LMIA Employer Work Permit', 'PGWP to PR', 'Express Entry CEC', 'PNP Provincial Nominee'] },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', visaRoutes: ['Subclass 482 (Skills in Demand)', '485 Graduate to PR', 'Subclass 186 ENS', 'State Nomination 190/491'] },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', visaRoutes: ['EU Blue Card', 'Opportunity Card (Chancenkarte)', 'Skilled Worker Permit', 'Job Seeker Permit'] },
  { name: 'United States', code: 'US', flag: '🇺🇸', visaRoutes: ['H-1B Specialty Occupation', 'F1 OPT/CPT to H-1B', 'O-1 Extraordinary Ability', 'EB-2/EB-3 Employment'] },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', visaRoutes: ['Accredited Employer Work Visa (AEWV)', 'Post-Study Work to PR', 'Green List Straight to Residence'] },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', visaRoutes: ['Critical Skills Employment Permit', 'General Employment Permit', 'Third Level Graduate Stamp 1G'] },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', visaRoutes: ['SSW-1 & SSW-2 Specified Skilled Worker', 'Engineer / Specialist in Humanities', 'Highly Skilled Professional'] },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', visaRoutes: ['Employment Pass (EP)', 'S Pass Technical Worker', 'ONE Pass'] },
  { name: 'European Union (Poland, Portugal, France, Romania)', code: 'EU', flag: '🇪🇺', visaRoutes: ['National Work Visa Type D', 'EU Blue Card', 'Seasonal & Long Term Work Permits'] },
]

/**
 * Filter locations by query or country
 */
export function filterRegionalLocations(query?: string, countryFilter?: string): RegionalLocation[] {
  let list = ALL_REGIONAL_LOCATIONS
  if (countryFilter && countryFilter !== 'all') {
    list = list.filter((item) => item.country.toLowerCase() === countryFilter.toLowerCase())
  }
  if (!query || !query.trim()) return list

  const q = query.toLowerCase().trim()
  return list.filter((item) =>
    item.name.toLowerCase().includes(q) ||
    item.majorCities.some((c) => c.toLowerCase().includes(q)) ||
    item.popularDestinations.some((d) => d.toLowerCase().includes(q)) ||
    item.primaryKeywords.some((k) => k.toLowerCase().includes(q))
  )
}
