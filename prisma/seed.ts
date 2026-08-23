import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VoyageAI database...");

  const user = await prisma.user.upsert({
    where: { email: "traveler@voyageai.com" },
    update: {},
    create: {
      email: "traveler@voyageai.com",
      name: "Voyage Traveler",
    },
  });

  // Create Seed Trip to Tokyo
  const trip1 = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "5-Day Tokyo Exploration",
      destination: "Tokyo",
      country: "Japan",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-15"),
      travelerCount: 2,
      budget: 2500,
      currency: "USD",
      travelStyle: "balanced",
      interestsJson: JSON.stringify(["Historical Landmarks", "Local Food & Fine Dining", "Museums & Galleries"]),
      constraintsJson: JSON.stringify({ maxDailyWalkingKm: 8, transportPreference: "public" }),
      status: "planned",
      coverImageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80",
    },
  });

  const day1 = await prisma.itineraryDay.create({
    data: {
      tripId: trip1.id,
      dayNumber: 1,
      date: new Date("2026-10-10"),
      theme: "Arrival & Historic Asakusa",
      summary: "Explore ancient Senso-ji temple and enjoy traditional street food.",
      estimatedCost: 180,
      travelDistance: 4.2,
      travelTime: 30,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        dayId: day1.id,
        title: "Senso-ji Temple & Nakamise Shopping",
        description: "Tokyo's oldest and most iconic Buddhist temple surrounded by vibrant market stalls.",
        category: "sightseeing",
        startTime: "09:30",
        endTime: "11:30",
        durationMinutes: 120,
        estimatedCost: 0,
        transportMode: "walk",
        lat: 35.7148,
        lng: 139.7967,
        address: "2-3-1 Asakusa, Taito City, Tokyo",
        weatherSensitivity: "outdoor",
      },
      {
        dayId: day1.id,
        title: "Traditional Asakusa Ramen & Gyoza",
        description: "Savor rich tonkotsu ramen at an acclaimed local Izakaya.",
        category: "food",
        startTime: "12:00",
        endTime: "13:15",
        durationMinutes: 75,
        estimatedCost: 25,
        transportMode: "walk",
        lat: 35.712,
        lng: 139.798,
        address: "Asakusa District, Tokyo",
        weatherSensitivity: "indoor",
      },
      {
        dayId: day1.id,
        title: "Tokyo Skytree Observation Deck",
        description: "Panoramic 360-degree views of Tokyo skyline and Mount Fuji.",
        category: "sightseeing",
        startTime: "14:00",
        endTime: "16:00",
        durationMinutes: 120,
        estimatedCost: 35,
        transportMode: "transit",
        lat: 35.7101,
        lng: 139.8107,
        address: "1-1-2 Oshiage, Sumida City, Tokyo",
        weatherSensitivity: "indoor",
      },
    ],
  });

  await prisma.budget.create({
    data: {
      tripId: trip1.id,
      totalPlanned: 1850,
      accommodationBudget: 900,
      foodBudget: 500,
      transportBudget: 200,
      activitiesBudget: 250,
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        tripId: trip1.id,
        category: "accommodation",
        title: "Tokyo Boutique Hotel (3 nights)",
        amount: 540,
        currency: "USD",
      },
      {
        tripId: trip1.id,
        category: "food",
        title: "Welcome Sushi Dinner",
        amount: 85,
        currency: "USD",
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
