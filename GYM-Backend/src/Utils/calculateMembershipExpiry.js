const calculateMembershipExpiry = (startDate, duration) => {
  const end = new Date(startDate);
  if (typeof duration === "number") {
    end.setMonth(end.getMonth() + duration);
  } else {
    switch (duration) {
      case "monthly":
        end.setMonth(end.getMonth() + 1);
        break;
      case "quarterly":
        end.setMonth(end.getMonth() + 3);
        break;
      case "halfYearly":
        end.setMonth(end.getMonth() + 6);
        break;
      case "yearly":
        end.setMonth(end.getMonth() + 12);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }
  }
  return end;
};

module.exports = calculateMembershipExpiry;
