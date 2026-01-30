import type { PrizeDistribution, SponsorPackage, Tournament, KnightProfile } from './types';

export const SPONSOR_PACKAGES: SponsorPackage[] = [
  {
    type: 'Bronze',
    amount: 5000,
    logoSize: 'small',
    benefits: [
      'Герб на странице турнира',
      'Упоминание в королевских грамотах',
      '2 места в VIP-ложе',
    ],
  },
  {
    type: 'Silver',
    amount: 15000,
    logoSize: 'medium',
    benefits: [
      'Увеличенный герб на странице',
      'Объявление глашатаями',
      '5 мест в VIP-ложе',
      'Знамя на рыцарской арене',
    ],
  },
  {
    type: 'Gold',
    amount: 30000,
    logoSize: 'large',
    benefits: [
      'Крупный герб на главной трибуне',
      'Упоминание в церемонии открытия',
      '10 мест в королевской ложе',
      'Эксклюзивная зона для гостей',
    ],
  },
  {
    type: 'Platinum',
    amount: 50000,
    logoSize: 'xlarge',
    benefits: [
      'Самый крупный герб у королевского места',
      'Турнир назван в честь спонсора',
      '20 мест в королевской ложе',
      'Эксклюзивные права на торговлю',
      'Встреча с рыцарями и королевской семьёй',
    ],
  },
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Великий Турнир в Честь Короля',
    status: 'REGISTRATION',
    targetAmount: 100000,
    collectedAmount: 100000,
    venue: 'Виндзорский замок, Англия',
    date: '2025-03-15',
    description: 'Грандиозный рыцарский турнир с участием лучших воинов королевства',
    requirements: {
      minVictories: 5,
      weightCategory: 'Тяжёлый вес',
      minExperience: 3,
    },
  },
  {
    id: '2',
    name: 'Весенний Турнир Копейщиков',
    status: 'REGISTRATION',
    targetAmount: 75000,
    collectedAmount: 75000,
    venue: 'Замок Уорик, Уорикшир',
    date: '2025-04-20',
    description: 'Состязание в поединках на копьях среди знатных рыцарей',
    requirements: {
      minVictories: 3,
      minExperience: 2,
    },
  },
  {
    id: '3',
    name: 'Турнир Круглого Стола',
    status: 'COMPLETED',
    targetAmount: 50000,
    collectedAmount: 50000,
    venue: 'Замок Тинтагель, Корнуолл',
    date: '2025-01-10',
    description: 'Легендарный турнир в честь короля Артура и рыцарей Круглого Стола',
    requirements: {
      minVictories: 10,
      minExperience: 5,
    },
    prizeCalculated: true,
  },
  {
    id: '4',
    name: 'Осенний Кубок Мечников',
    status: 'CREATED',
    targetAmount: 60000,
    collectedAmount: 15000,
    venue: 'Замок Карнарвон, Уэльс',
    date: '2025-06-01',
    description: 'Турнир фехтования и владения мечом',
  },
];

export const MOCK_KNIGHT: KnightProfile = {
  id: 'knight-1',
  name: 'Сэр Ланселот',
  height: 185,
  weight: 90,
  victories: 12,
  experience: 6,
};

export const INITIAL_PRIZE_DISTRIBUTIONS: PrizeDistribution[] = [
  {
    tournamentId: '3',
    first: { knightId: 'k1', knightName: 'Сэр Галахад', amount: 25000 },
    second: { knightId: 'k2', knightName: 'Сэр Гавейн', amount: 12500 },
    third: { knightId: 'k3', knightName: 'Сэр Персиваль', amount: 5000 },
    audienceChoice: { knightId: 'k1', knightName: 'Сэр Галахад', amount: 2500 },
    calculatedAt: '2025-01-15T10:00:00Z',
  },
];
