// Mock data for social proof notifications
// Uses US-based customer names and locations

export interface MockPurchase {
    firstName: string;
    location: string;
    productName: string;
    productImage: string;
    timeAgo: string;
}

// Common US first names
export const US_FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa"
];

// US cities and states
export const US_LOCATIONS = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Boston, MA",
    "Nashville, TN", "Portland, OR", "Las Vegas, NV", "Detroit, MI", "Memphis, TN",
    "Louisville, KY", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ",
    "Miami, FL", "Atlanta, GA", "Fresno, CA", "Sacramento, CA", "Kansas City, MO",
    "Cleveland, OH", "Mesa, AZ", "Virginia Beach, VA", "Omaha, NE", "Oakland, CA"
];

// Time ago strings for realism
export const TIME_AGO_OPTIONS = [
    "just now",
    "1 minute ago",
    "2 minutes ago",
    "3 minutes ago",
    "5 minutes ago",
    "8 minutes ago",
    "12 minutes ago",
    "15 minutes ago",
    "20 minutes ago"
];

// Get a random item from an array
function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a mock purchase notification
export function generateMockPurchase(products: { name: string; image: string }[]): MockPurchase {
    const product = products.length > 0
        ? getRandomItem(products)
        : { name: "Premium Product", image: "/placeholder.svg" };

    return {
        firstName: getRandomItem(US_FIRST_NAMES),
        location: getRandomItem(US_LOCATIONS),
        productName: product.name,
        productImage: product.image,
        timeAgo: getRandomItem(TIME_AGO_OPTIONS)
    };
}
