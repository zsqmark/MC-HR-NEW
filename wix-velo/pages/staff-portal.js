import {
  clockIn,
  clockOut,
  getMyPortal,
  saveMyAvailability,
} from 'backend/portal.web';

let portal;

$w.onReady(async () => {
  $w('#errorText').collapse();
  $w('#clockOutButton').disable();
  $w('#saveAvailabilityButton').onClick(saveAvailability);
  $w('#clockInButton').onClick(handleClockIn);
  $w('#clockOutButton').onClick(handleClockOut);

  await refreshPortal();
});

async function refreshPortal() {
  try {
    portal = await getMyPortal();
    $w('#welcomeText').text = `Welcome, ${portal.profile.firstName}`;
    $w('#positionText').text = portal.profile.position || 'Staff member';
    $w('#scheduleRepeater').data = portal.shifts;
    $w('#scheduleRepeater').onItemReady(($item, shift) => {
      $item('#shiftDateText').text = new Date(shift.date).toLocaleDateString();
      $item('#shiftTimeText').text = `${shift.startTime}–${shift.endTime}`;
      $item('#shiftTypeText').text = shift.shiftType || 'Shift';
    });

    const hasOpenRecord = Boolean(portal.openClockRecord);
    if (hasOpenRecord) {
      $w('#clockInButton').disable();
      $w('#clockOutButton').enable();
      $w('#clockStatusText').text = 'You are clocked in.';
    } else {
      $w('#clockInButton').enable();
      $w('#clockOutButton').disable();
      $w('#clockStatusText').text = 'You are currently clocked out.';
    }
  } catch (error) {
    showError(error);
  }
}

async function handleClockIn() {
  try {
    disableClockButtons();
    await clockIn($w('#shiftDropdown').value || null, $w('#clockNotesInput').value || '');
    await refreshPortal();
  } catch (error) {
    showError(error);
    await refreshPortal();
  }
}

async function handleClockOut() {
  try {
    disableClockButtons();
    await clockOut(
      portal.openClockRecord._id,
      Number($w('#breakMinutesInput').value || 0),
      $w('#clockNotesInput').value || '',
    );
    await refreshPortal();
  } catch (error) {
    showError(error);
    await refreshPortal();
  }
}

async function saveAvailability() {
  try {
    $w('#saveAvailabilityButton').disable();
    await saveMyAvailability($w('#weekStartPicker').value, {
      monday: $w('#mondayAvailabilityInput').value,
      tuesday: $w('#tuesdayAvailabilityInput').value,
      wednesday: $w('#wednesdayAvailabilityInput').value,
      thursday: $w('#thursdayAvailabilityInput').value,
      friday: $w('#fridayAvailabilityInput').value,
      saturday: $w('#saturdayAvailabilityInput').value,
      sunday: $w('#sundayAvailabilityInput').value,
    });
    $w('#availabilityStatusText').text = 'Availability saved.';
  } catch (error) {
    showError(error);
  } finally {
    $w('#saveAvailabilityButton').enable();
  }
}

function disableClockButtons() {
  $w('#clockInButton').disable();
  $w('#clockOutButton').disable();
}

function showError(error) {
  $w('#errorText').text = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  $w('#errorText').expand();
}
