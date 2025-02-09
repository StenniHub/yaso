export class FileResult {
  declare name: string;
  declare path: string;
  declare isFolder: boolean;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.isFolder = false;
  }

}

export class FolderResult extends FileResult {
  declare folders: Array<FolderResult>;
  declare files: Array<FileResult>;

  constructor(name: string, path: string) {
    super(name, path);
    this.isFolder = true;
    this.folders = [];
    this.files = [];
  }
}
