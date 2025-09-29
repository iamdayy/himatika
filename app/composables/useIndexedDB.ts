import Dexie, { type Table } from "dexie";

interface PageGuide {
  id?: number;
  page: string;
  version: string;
}

class MyDatabase extends Dexie {
  pageGuides!: Table<PageGuide>;

  constructor() {
    super("myDatabase");
    this.version(1).stores({
      pageGuides: "++id, page, version", // Primary key dan index
    });
  }
}

export function useIndexedDB() {
  const db = new MyDatabase();

  const storeGuideData = async (page: string, version: string) => {
    await db.pageGuides.where("page").equals(page).delete();
    await db.pageGuides.add({ page, version });
  };

  const getGuideData = async (page: string) => {
    const data = await db.pageGuides.where("page").equals(page).last();
    return data;
  };
  return { storeGuideData, getGuideData };
}
