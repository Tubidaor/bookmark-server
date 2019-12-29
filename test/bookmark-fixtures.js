function makeBookmarksArray() {
  return [
    {
        id: 1,
        title: "ESPN",
        url: "www.espn.com",
        description: "the worldwide leader in sports",
        rating: 4
    },
    {
        id: 2,
        title: "The Ringer",
        url: "www.theringer.com",
        description: "pop culture sports and entertainment",
        rating: 4
    },
    {
        id: 3,
        title: "The Washington Post",
        url: "wwww.thewashingtonpost.com",
        description: "local and global news",
        rating: 5
    },
    {
        id: 4,
        title: "Scientific American",
        url: "wwww.scientificamerican.com",
        description: "science magazine",
        rating: 4
    },
    {
        id: 5,
        title: "The Dallas Cowboys",
        url: "www.dallascowboys.com",
        description: "The Dallas Cowboys official site",
        rating: 3
    }
  ]
}

module.exports = {
  makeBookmarksArray,
}