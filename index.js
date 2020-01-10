// Helper functions
const consolidateSortedStalks = sortedStalks => (
  sortedStalks.reduce(
    (consolidated, remainder) => [...consolidated, ...remainder],
    []
  )
)

const sortIntoFours = (stalks = []) => {
	const numberOfStalks = stalks.length

	const incompleteFours = numberOfStalks % 4 ? [numberOfStalks % 4] : []

	const numberOfCompleteFours = (numberOfStalks - (numberOfStalks % 4)) / 4
	const completeFours = Array.from({ length: numberOfCompleteFours }, () => 4)

	const allFours = [...completeFours, ...incompleteFours]

	const sliceIndices = [
		0,
		...allFours.map((fours, index) => index * 4 + fours)
	]
	const sliceArgumentArrays = sliceIndices.reduce(
		(result, sliceIndex, index, sliceIndices) => (
      sliceIndices.length !== index + 1
				? [...result, [sliceIndex, sliceIndices[index + 1]]]
				: result
    ),
		[]
	)

	return sliceArgumentArrays.map(
    sliceArgumentArray => stalks.slice(...sliceArgumentArray)
	)
}

// 大衍之數五十，其用四十有九。
const principalNumberOfDerivation = 50
const allStalks = (
  Array.from(
    { length: principalNumberOfDerivation },
    (_, index) => index + 1
  )
)
const stalksBeforeParting = allStalks.slice(0, allStalks.length - 1)

// 【一營】分而為二以象兩
const partTheStalks = (
  {
	  unpartedStalks = [],
	  partStalksAtIndex = 0,
	  suspendedFromNextRound
  }
) => (
  {
  	unsortedLeft: unpartedStalks.slice(0, partStalksAtIndex),
	  unsortedRight: unpartedStalks.slice(partStalksAtIndex),
	  suspendedFromNextRound
  }
)

// 【二營】掛一以象參
const suspendOneFromTheRight = (
  {
  	unsortedLeft = [],
  	unsortedRight = [],
  	suspendedFromNextRound
  }
) => (
  {
    unsortedLeft,
    unsortedRight: unsortedRight.slice(0, unsortedRight.length - 1),
    suspendedFromRight: unsortedRight.slice(unsortedRight.length - 1),
    suspendedFromNextRound
  }
)

// 【三營】揲之以四以象四時
const sortLeftAndRightIntoFours = (
  {
    unsortedLeft = [],
    unsortedRight = [],
    suspendedFromRight = [],
    suspendedFromNextRound
  }
) => (
  {
    sortedLeft: sortIntoFours(unsortedLeft),
    sortedRight: sortIntoFours(unsortedRight),
    suspendedFromRight,
    suspendedFromNextRound
  }
)

// 【四營】歸奇於扐以象閏，五歲再閏，故再扐而後掛。
const setAsideRemainderFromSortedLeftAndRight = (
  {
    sortedLeft = [],
    sortedRight = [],
    suspendedFromRight = [],
    suspendedFromNextRound
  }
) => (
  {
    sortedLeft: sortedLeft.slice(0, sortedLeft.length - 1),
    sortedRight: sortedRight.slice(0, sortedRight.length - 1),
    suspendedFromRight,
    leftRemainder: consolidateSortedStalks(
      sortedLeft.slice(sortedLeft.length - 1)
    ),
    rightRemainder: consolidateSortedStalks(
      sortedRight.slice(sortedRight.length - 1)
    ),
    suspendedFromNextRound
  }
)
const consolidateSortedStalksForNextRound = (
  {
    sortedLeft,
    sortedRight,
    suspendedFromRight,
    leftRemainder,
    rightRemainder,
    suspendedFromNextRound
  }
) => (
  {
    unpartedStalks: [
      ...consolidateSortedStalks(sortedLeft),
      ...consolidateSortedStalks(sortedRight)
    ],
    suspendedFromNextRound: [
      ...suspendedFromNextRound,
      ...leftRemainder,
      ...rightRemainder,
      ...suspendedFromRight
    ]
  }
)

// Array of functions for a complete round
// 四營而成易
/* 
【一營】分而為二以象兩
【二營】掛一以象參
【三營】 揲之以四以象四時
【四營】歸奇於扐以象閏，五歲再閏，故再扐而後掛。
 */
const round = [
  partTheStalks,
  suspendOneFromTheRight,
  sortLeftAndRightIntoFours,
  setAsideRemainderFromSortedLeftAndRight,
  consolidateSortedStalksForNextRound
]

// Pipe the functions for a complete round
const obtainResultFromEachRound = unpartedStalksAndPartingPosition => (
  round.reduce(
		(result, nextStep) => nextStep(result),
		unpartedStalksAndPartingPosition
	)
)

// Pipe three rounds for a complete line
const makeLineGenerator = function* (
  roundOneArguments = {
    unpartedStalks: stalksBeforeParting,
    suspendedFromNextRound: [],
    partStalksAtIndex: Math.floor(Math.random() * stalksBeforeParting.length)
  }
) {
  const rounds = Array(3).fill(obtainResultFromEachRound)

  let nextRoundArguments = roundOneArguments

  for (const round of rounds) {
    const result = round(nextRoundArguments)
    nextRoundArguments = yield result
  }

  return nextRoundArguments.unpartedStalks.length / 4
}

const splitStalksRandomly = unpartedStalks => (
  1 + Math.floor(Math.random() * unpartedStalks.length) - 1
)

const obtainOneLine = function* () {
  const initialArguments = {
    unpartedStalks: stalksBeforeParting,
    suspendedFromNextRound: [],
  }

  const roundOneArguments = {
    ...initialArguments,
    partStalksAtIndex: splitStalksRandomly(initialArguments.unpartedStalks)
  }
  const lineGenerator = makeLineGenerator(roundOneArguments)
  const roundOneResults = lineGenerator.next().value
  // console.log('roundOneResults', roundOneResults)

  const roundTwoArguments = {
    ...roundOneResults,
    partStalksAtIndex: splitStalksRandomly(roundOneResults.unpartedStalks)
  }
  const roundTwoResults = lineGenerator.next(roundTwoArguments).value
  // console.log('roundTwoResults', roundTwoResults)

  const roundThreeArguments = {
    ...roundTwoResults,
    partStalksAtIndex: splitStalksRandomly(roundTwoResults.unpartedStalks)
  }
  const roundThreeResults = lineGenerator.next(roundThreeArguments).value
  // console.log('roundThreeResults', roundThreeResults)

  const { value: line } = lineGenerator.next(roundThreeResults)
  // console.log('line', line)

  yield {
    line,
    rounds: [
      roundOneResults,
      roundTwoResults,
      roundThreeResults
    ]
  }
}

// 十有八變而成卦。
const makeHexagramGenerator = function* () {
  const lines = Array(6).fill(obtainOneLine)

  for (const line of lines) { yield* line() }
}

const generateHexagram = () => {
  const obtainHexagram = makeHexagramGenerator()

  return (
    Array(6).fill()
      .map(() => obtainHexagram.next())
      .map(({ value }) => value.line)
  )
}

generateHexagram()

const generate1000Hexagrams = () => Array(1000).fill().map(() => generateHexagram())

// generate1000Hexagrams()

const generate1000Lines = () => {
  const roundToPrecision = (x, precision = 2) => {
      var y = +x + (precision / 2);
      return y - (y % (+precision));
  }
  const numberOfRuns = 1000
  const runs = (
    Array
      .from({ length: numberOfRuns }, () => obtainOneLine)
      .map(obtainOneLine => obtainOneLine().next())
  )

  breakdown = (
    [5, 6, 7, 8, 9, 10]
      .map(value => [value, runs.filter(result => result.value.line === value).length])
      .map(([value, count]) => [value, count / numberOfRuns * 100])
      .map(([value, percentage]) => `Line ${value}: ${roundToPrecision(percentage)}%`)
  )

  return breakdown
}

// generate1000Lines()