const participants = {}
const participantIds = Object.keys(participants);
const winnerIds = [];
const filteredParticipants = participantIds
    .filter((participantId) => (!winnerIds.includes(participantId)))
    .filter((participantId) => {
        const participantRankings = participants[participantId].rankings;
        const filteredRankings = participantRankings.filter((ranking) => (
            true
            // && ranking.key !== 'A'
            // && ranking.key !== 'B'
            // && ranking.key !== 'C'
            // && ranking.key !== 'D'
            // && ranking.key !== '1'
            // && ranking.key !== '2'
            // && ranking.key !== '3'
        ))
    })
console.log(participantIds)
