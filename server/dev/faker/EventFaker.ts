import { fakerID_ID as idFaker } from "@faker-js/faker";
import { EventModel } from "~/server/models/EventModel";
import { IEvent } from "~/types";

export const seedEvent = async () => {
  const seedData: IEvent[] = [];
  for (let i = 0; i < 100; i++) {
    const fakeData: IEvent = {
      title: idFaker.lorem.word(),
      date: idFaker.date.anytime(),
      at: idFaker.location.secondaryAddress(),
      canSee: idFaker.helpers.arrayElement([
        "Admin",
        "Departement",
        "Internal",
        "All",
        "External",
        "No",
      ]),
      description: idFaker.lorem.paragraph(),
      committee: [
        {
          user: "661032b7c464259d7e6ee496",
          job: "Chief",
        },
      ],
      canRegister: idFaker.helpers.arrayElement([
        "Admin",
        "Departement",
        "Internal",
        "All",
        "External",
        "No",
      ]),
    };
    seedData.push(fakeData);
  }
  const profile = EventModel.insertMany(seedData);
};
