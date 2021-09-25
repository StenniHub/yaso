export class FileObject {
  declare name: string;
  declare path: string;
  declare isFolder: boolean;

  constructor(name: string, path: string, isFolder: boolean) {
    this.name = name;
    this.path = path;
    this.isFolder = isFolder;
  }
}
