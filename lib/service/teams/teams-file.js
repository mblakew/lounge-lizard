
const File = require('../../model/file')

class TeamsFile extends File {
  constructor(fileName, contentUrl) {
    super(fileName, null, null)
    this.downloadUrl = contentUrl

    const extension = this.getExtension(fileName)

    if (extension) {
      this.typeName = extension.toUpperCase() + " file"
    } else {
      this.typeName = "Unknown file type"
    }
  }

  getExtension(fileName) {
    if (fileName && fileName.includes(".")) {
      const index = fileName.lastIndexOf(".")
      return fileName.substring(index + 1)
    } else {
      return null;
    }
  }
}

module.exports = TeamsFile
