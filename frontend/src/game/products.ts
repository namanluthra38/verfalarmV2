import type { ProductType } from './types';

export const PRODUCT_TYPES: ProductType[] = [
    {
        id: 'milk',
        emoji: '🧃',
        label: 'Juice',
        color: '#f0f0f0',
    },
    {
        id: 'apple',
        emoji: '🍎',
        label: 'Apple',
        color: '#ff6b6b',
    },
    {
        id: 'bread',
        emoji: '🥖',
        label: 'Bread',
        color: '#f4a460',
    },
    {
        id: 'cheese',
        emoji: '🧀',
        label: 'Cheese',
        color: '#ffd700',
    },
    {
        id: 'egg',
        emoji: '🥚',
        label: 'Egg',
        color: '#faf0e6',
    },
    {
        id: 'strawberry',
        emoji: '🍓',
        label: 'Berry',
        color: '#ff4757',
    },
];

export function getRandomProduct(): ProductType {
    return PRODUCT_TYPES[Math.floor(Math.random() * PRODUCT_TYPES.length)];
}
