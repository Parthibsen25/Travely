function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getPeopleCount(booking) {
  const people = Math.trunc(toSafeNumber(booking?.numberOfPeople, 1));
  return people > 0 ? people : 1;
}

function getBookingTotalAmount(booking) {
  const finalAmount = toSafeNumber(booking?.finalAmount, 0);
  const peopleCount = getPeopleCount(booking);

  if (booking?.amountMode === 'TOTAL') {
    return Number(finalAmount.toFixed(2));
  }

  // Backward compatibility: older bookings stored per-person amount.
  return Number((finalAmount * peopleCount).toFixed(2));
}

module.exports = {
  getBookingTotalAmount
};
