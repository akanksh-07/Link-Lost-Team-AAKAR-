/**
 * Lost-Link Constants & Configuration
 * [COLLEGE NAME] Campus Lost & Found System
 */

export interface ItemCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'electronics', name: 'Electronics', icon: 'Laptop', color: 'bg-[#E7F3F0] text-[#0E6251] border-[#0E6251]/30' },
  { id: 'wallets_ids', name: 'Wallets & IDs', icon: 'CreditCard', color: 'bg-[#FCECE8] text-[#D94825] border-[#D94825]/30' },
  { id: 'keys', name: 'Keys', icon: 'Key', color: 'bg-[#FEF3C7] text-[#92400E] border-[#D97706]/30' },
  { id: 'bags', name: 'Bags & Backpacks', icon: 'Briefcase', color: 'bg-[#EFE4D3] text-[#6B5035] border-[#DECBB6]' },
  { id: 'books', name: 'Books & Stationery', icon: 'BookOpen', color: 'bg-[#FFF7ED] text-[#C2410C] border-[#FB923C]/30' },
  { id: 'clothing', name: 'Clothing & Accessories', icon: 'Shirt', color: 'bg-[#F3E8FF] text-[#6B21A8] border-[#A855F7]/30' },
  { id: 'bottles', name: 'Water Bottles & Mugs', icon: 'Coffee', color: 'bg-[#E0F2FE] text-[#0369A1] border-[#38BDF8]/30' },
  { id: 'sports', name: 'Sports Equipment', icon: 'Activity', color: 'bg-[#ECFCCB] text-[#3F6212] border-[#84CC16]/30' },
  { id: 'other', name: 'Other', icon: 'Package', color: 'bg-[#F5F5F4] text-[#44403C] border-[#D6D3D1]' },
];

export interface CampusLocation {
  id: string;
  name: string;
  building: string;
  zone: 'Academic' | 'Residential' | 'Dining' | 'Sports' | 'Transit' | 'Arts';
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { id: 'lib-1', name: 'Central Library - 1st Floor Study Commons', building: 'University Library', zone: 'Academic' },
  { id: 'lib-2', name: 'Central Library - 2nd Floor Quiet Stacks', building: 'University Library', zone: 'Academic' },
  { id: 'sci-101', name: 'Science Complex - Lecture Hall 101', building: 'Hasbrouck Science Hall', zone: 'Academic' },
  { id: 'eng-3', name: 'Engineering Wing - Computer Lab 3', building: 'Engineering Hall', zone: 'Academic' },
  { id: 'dining-foodcourt', name: 'Student Union - Main Food Court', building: 'Student Union', zone: 'Dining' },
  { id: 'rec-gym', name: 'Campus Recreation Center - Main Gym', building: 'Recreation Center', zone: 'Sports' },
  { id: 'north-lobby', name: 'North Quad - Residence Hall Lobby', building: 'North Residence Hall', zone: 'Residential' },
  { id: 'south-lounge', name: 'South Quad - Common Lounge', building: 'South Residence Hall', zone: 'Residential' },
  { id: 'transit-hub', name: 'Campus Transit Hub & Shuttle Stop', building: 'Transit Pavilion', zone: 'Transit' },
  { id: 'arts-center', name: 'Auditorium & Fine Arts Hallway', building: 'Arts Center', zone: 'Arts' },
];

export type ItemStatus = 'unclaimed' | 'in_review' | 'claimed' | 'returned' | 'archived';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ITEM_STATUS_CONFIG: Record<ItemStatus, StatusMeta> = {
  unclaimed: {
    label: 'FOUND · UNCLAIMED',
    badgeClass: 'stamp-found',
    dotClass: 'bg-[#0E6251]',
    description: 'Found and currently held in storage; awaiting rightful owner link.',
  },
  in_review: {
    label: 'IN REVIEW',
    badgeClass: 'stamp-review',
    dotClass: 'bg-[#B45309] animate-pulse',
    description: 'A claim has been filed and is undergoing security verification.',
  },
  claimed: {
    label: 'CLAIM APPROVED',
    badgeClass: 'stamp-found',
    dotClass: 'bg-[#0E6251]',
    description: 'Claim verified and approved! Ready for student pickup at campus dispatch.',
  },
  returned: {
    label: 'RETURNED',
    badgeClass: 'stamp-returned',
    dotClass: 'bg-[#15803D]',
    description: 'Item successfully linked and handed back to its verified owner.',
  },
  archived: {
    label: 'ARCHIVED',
    badgeClass: 'rubber-stamp text-[#6B6258] border-[#8C7E70] bg-[#6B6258]/10',
    dotClass: 'bg-[#8C7E70]',
    description: 'Item held past standard campus retention window.',
  },
};

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: 'PENDING REVIEW',
    badgeClass: 'rubber-stamp stamp-review text-xs',
  },
  approved: {
    label: 'CLAIM APPROVED',
    badgeClass: 'rubber-stamp stamp-returned text-xs',
  },
  rejected: {
    label: 'CLAIM REJECTED',
    badgeClass: 'rubber-stamp stamp-lost text-xs',
  },
};

export const STORAGE_LOCATIONS = [
  'Central Security Desk - Bin A1',
  'Central Security Desk - Bin A2 (High Value/Electronics)',
  'Central Security Desk - Lockbox C (Keys & Wallets)',
  'Library Lost & Found Cabinet - Shelf 2',
  'Student Union Info Desk - Bin 1',
  'Campus Recreation Desk - Shelf B',
];
