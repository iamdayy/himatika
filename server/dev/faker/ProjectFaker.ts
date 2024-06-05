import { fakerID_ID as idFaker } from "@faker-js/faker";
import { Types } from "mongoose";
import { ProjectModel } from "~/server/models/ProjectModel";
import { IProject } from "~/types";

export const seedProject = async () => {
  const seedData: IProject[] = [];
  for (let i = 0; i < 100; i++) {
    const fakeData: IProject = {
      title: idFaker.lorem.word(),
      deadline: idFaker.date.anytime(),
      canSee: idFaker.helpers.arrayElement([
        "Admin",
        "Departement",
        "Internal",
        "All",
        "External",
        "No",
      ]),
      description: idFaker.lorem.paragraph(),
      contributors: [
        {
          profile: "661032b7c464259d7e6ee496" as unknown as Types.ObjectId,
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
    for (let j = 0; i < 5; i++) {
      fakeData.tasks?.push(idFaker.person.jobType());
    }
    seedData.push(fakeData);
  }
  const profile = ProjectModel.insertMany(seedData);
};
