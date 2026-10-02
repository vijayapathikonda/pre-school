export interface TeacherProfile {
  name: string;
  email: string;
  role: 'Admin' | 'Teacher';
  assignedClasses: string[]; // Classroom IDs, or ['*'] for all
  defaultClassId?: string;
}

export const TEACHER_WHITELIST: Record<string, TeacherProfile> = {
  'vijaya.pathikonda@gmail.com': {
    name: 'Vijaya Pathikonda',
    email: 'vijaya.pathikonda@gmail.com',
    role: 'Admin',
    assignedClasses: ['*'],
  },
  'kavyay294@gmail.com': {
    name: 'Kavya Y',
    email: 'kavyay294@gmail.com',
    role: 'Admin',
    assignedClasses: ['*'],
  },
  'shilpaclk1999@gmail.com': {
    name: 'Shilpa S',
    email: 'shilpaclk1999@gmail.com',
    role: 'Admin',
    assignedClasses: ['*'],
    defaultClassId: 'playhome',
  },
  'arupruthvi1807@gmail.com': {
    name: 'Aruna E',
    email: 'arupruthvi1807@gmail.com',
    role: 'Teacher',
    assignedClasses: ['ukg_jnana'],
    defaultClassId: 'ukg_jnana',
  },
  'swathigg143@gmail.com': {
    name: 'G Swathi',
    email: 'swathigg143@gmail.com',
    role: 'Teacher',
    assignedClasses: ['ukg_jnana', 'ukg_samriddhi'],
    defaultClassId: 'ukg_jnana',
  },
  'shwethar012@gmail.com': {
    name: 'Swetha R',
    email: 'shwethar012@gmail.com',
    role: 'Teacher',
    assignedClasses: ['nursery_jnana'],
    defaultClassId: 'nursery_jnana',
  },
  'swathinaga2016@gmail.com': {
    name: 'Swathi CN',
    email: 'swathinaga2016@gmail.com',
    role: 'Teacher',
    assignedClasses: ['lkg_jnana'],
    defaultClassId: 'lkg_jnana',
  },
  'lbhavana317@gmail.com': {
    name: 'Bhavana L',
    email: 'lbhavana317@gmail.com',
    role: 'Teacher',
    assignedClasses: ['lkg_jnana'],
    defaultClassId: 'lkg_jnana',
  },
  'shilpavaru10@gmail.com': {
    name: 'Shilpa T',
    email: 'shilpavaru10@gmail.com',
    role: 'Teacher',
    assignedClasses: ['lkg_samriddhi'],
    defaultClassId: 'lkg_samriddhi',
  },
  'santhoshclk2022@gmail.com': {
    name: 'Nirmala',
    email: 'santhoshclk2022@gmail.com',
    role: 'Teacher',
    assignedClasses: ['ukg_samriddhi'],
    defaultClassId: 'ukg_samriddhi',
  },
  'tejashreekiran21@gmail.com': {
    name: 'Tejashree',
    email: 'tejashreekiran21@gmail.com',
    role: 'Teacher',
    assignedClasses: ['nursery_satya'],
    defaultClassId: 'nursery_satya',
  },
  'anushashamanth09@gmail.com': {
    name: 'Anusha',
    email: 'anushashamanth09@gmail.com',
    role: 'Teacher',
    assignedClasses: ['nursery_shourya'],
    defaultClassId: 'nursery_shourya',
  },
  'ashwinicharan54@gmail.com': {
    name: 'Ashwini KJ',
    email: 'ashwinicharan54@gmail.com',
    role: 'Teacher',
    assignedClasses: ['ukg_shourya'],
    defaultClassId: 'ukg_shourya',
  },
  'manasamanu399@gmail.com': {
    name: 'Manasa T',
    email: 'manasamanu399@gmail.com',
    role: 'Teacher',
    assignedClasses: ['playhome'],
    defaultClassId: 'playhome',
  },
  'shruthimanju070@gmail.com': {
    name: 'Shruthi T',
    email: 'shruthimanju070@gmail.com',
    role: 'Teacher',
    assignedClasses: ['ukg_satya'],
    defaultClassId: 'ukg_satya',
  },
  'lakshmiragavendra1990@gmail.com': {
    name: 'Lakshmi Devi',
    email: 'lakshmiragavendra1990@gmail.com',
    role: 'Teacher',
    assignedClasses: ['lkg_satya'],
    defaultClassId: 'lkg_satya',
  },
  'manasasunil1998@gmail.com': {
    name: 'Manasa M',
    email: 'manasasunil1998@gmail.com',
    role: 'Teacher',
    assignedClasses: ['lkg_shourya'],
    defaultClassId: 'lkg_shourya',
  },
};

export function getTeacherProfile(email: string | null | undefined): TeacherProfile | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return TEACHER_WHITELIST[normalized] || null;
}
