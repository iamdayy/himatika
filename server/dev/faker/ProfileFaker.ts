import { fakerID_ID as idFaker } from "@faker-js/faker";
import { ProfileModel } from "~/server/models/ProfileModel";
import { IProfile } from "~/types";

export const seedProfile = async () => {
  const seedData: IProfile[] = [];
  for (let i = 0; i < 100; i++) {
    const fakeData: IProfile = {
      NIM: idFaker.number.int({ min: 1000000, max: 99999999 }),
      fullName: idFaker.person.fullName(),
      avatar: "",
      class: idFaker.word.sample(5),
      semester: idFaker.number.int({ min: 1, max: 14 }),
      birth: {
        place: idFaker.location.city(),
        date: idFaker.date.birthdate(),
      },
      sex: idFaker.person.sexType(),
      religion: "Islam",
      citizen: idFaker.location.city(),
      phone: idFaker.phone.number(),
      email: idFaker.internet.email(),
      address: {
        fullAddress: idFaker.location.secondaryAddress(),
        village: idFaker.location.buildingNumber(),
        district: idFaker.location.direction(),
        city: idFaker.location.city(),
        province: idFaker.location.state(),
        country: idFaker.location.country(),
        zip: parseInt(idFaker.location.zipCode()),
      },
      isRegistered: false,
    };
    seedData.push(fakeData);
  }
  const profile = ProfileModel.insertMany(seedData);
};
