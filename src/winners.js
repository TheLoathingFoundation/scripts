winners = {
  "2023-04": [
    {
      "playerId": 1750910,
      "item": "boxed autumn-aton",
      "accessoryPrice": 58125000,
      "mallPrice": 139700000,
			"status": "traded"
    }
  ],
  "2023-05": [
    {
      "playerId": 3143706,
      "item": "Horsery Contract",
      "accessoryPrice": 57775000,
      "mallPrice": 420697000,
			"status": "traded"
    },
    {
      "playerId": 2118617,
      "item": "grey gosling",
      "accessoryPrice": 57775000,
      "mallPrice": 375375000,
			"status": "traded"
    },
    {
      "playerId": 1788525,
      "item": "mummified entombed cookbookbat",
      "accessoryPrice": 57775000,
      "mallPrice": 125000000,
			"status": "traded"
    },
    {
      "playerId": 2155764,
      "item": "packaged model train set",
      "accessoryPrice": 57775000,
      "mallPrice": 123000000,
			"status": "traded"
    },
    {
      "playerId": 1419297,
      "item": "boxed autumn-aton",
      "accessoryPrice": 57775000,
      "mallPrice": 139000000,,
			"status": "declined"
    }
  ],
  "2023-06": [
    {
      "playerId": 2732184,
      "item": "Origami Pasties",
      "accessoryPrice": 59400000,
      "mallPrice": 160000000,
			"status": "traded"
    },
    {
      "playerId": 2109704,
      "item": "packaged model train set",
      "accessoryPrice": 59400000,
      "mallPrice": 129000000,
			"status": "traded"
    },
    {
      "playerId": 1057104,
      "item": "grey gosling",
      "accessoryPrice": 59400000,
      "mallPrice": 321000000,
			"status": "traded"
    },
    {
      "playerId": 2072416,
      "item": "boxed autumn-aton",
      "accessoryPrice": 59400000,
      "mallPrice": 133000000,
			"status": "pending??"
    },
    {
      "playerId": 2270868,
			"playerName": "Hedgemonster",
      "item": "mummified entombed cookbookbat",
      "accessoryPrice": 59400000,
      "mallPrice": 125000000,
			"status": "traded"
    },
    {
      "playerId": 3143706,
      "item": "boxed autumn-aton",
      "accessoryPrice": 59400000,
      "mallPrice": 133000000,
			"status": "pending??"
    }
  ],
  "2023-07": [
    {
      "playerId": 684704,
      "item": "Pantogram",
      "accessoryPrice": 59450200,
      "mallPrice": 330000000,
			"status": "traded"
    },
    {
      "playerId": 3613131,
      "item": "grey gosling",
      "accessoryPrice": 59450200,
      "mallPrice": 309000000,
			"status": "traded"
    },
    {
      "playerId": 625501,
			"playerName": "grovel",
      "item": "packaged model train set",
      "accessoryPrice": 59450200,
      "mallPrice": 128000000,
			"status": "pending"
    },
    {
      "playerId": 2348974,
      "item": "boxed autumn-aton",
      "accessoryPrice": 59450200,
      "mallPrice": 124000000,
			"status": "traded"
    },
    {
      "playerId": 1891423,
      "item": "mummified entombed cookbookbat",
      "accessoryPrice": 59450200,
      "mallPrice": 140000000,
			"status": "traded"
    }
  ]
}

totalSavings = 0

for (const month in winners) {
  const items = winners[month];
  for (const item of items) {
    const difference = item.mallPrice - (item.accessoryPrice * 1.3);
		if(!item.skipped) {
			totalSavings += difference
		}
  }
}
console.log(totalSavings);
