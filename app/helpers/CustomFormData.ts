export class CustomFormData<MyFormData> {
  private formData: FormData;
  constructor() {
    this.formData = new FormData();
  }
  public append<K extends keyof MyFormData>(
    key: K extends string ? K : never,
    value: MyFormData[K] extends Blob ? MyFormData[K] : string | Blob
  ) {
    this.formData.append(key, value);
  }
  public getFormData() {
    return this.formData;
  }
}
