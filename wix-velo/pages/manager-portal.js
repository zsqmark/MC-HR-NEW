import {
  approveClockRecord,
  getManagerSchedule,
  saveShift,
} from 'backend/portal.web';

let schedule;

$w.onReady(async () => {
  $w('#errorText').collapse();
  $w('#loadScheduleButton').onClick(loadSchedule);
  $w('#saveShiftButton').onClick(saveScheduleShift);
  await loadSchedule();
});

async function loadSchedule() {
  try {
    const from = $w('#fromDatePicker').value;
    const to = $w('#toDatePicker').value;
    schedule = await getManagerSchedule(from, to);

    $w('#shiftRepeater').data = schedule.shifts;
    $w('#shiftRepeater').onItemReady(($item, shift) => {
      $item('#shiftSummaryText').text = `${new Date(shift.date).toLocaleDateString()} · ${shift.startTime}–${shift.endTime}`;
      $item('#shiftRoleText').text = shift.roleRequired || 'Unspecified role';
      $item('#assignedStaffText').text = staffName(shift.assignedMemberId);
      $item('#editShiftButton').onClick(() => populateShiftForm(shift));
    });

    $w('#assigneeDropdown').options = schedule.staff.map((staff) => ({
      label: `${staff.firstName} ${staff.lastName}`,
      value: staff.memberId,
    }));
  } catch (error) {
    showError(error);
  }
}

async function saveScheduleShift() {
  try {
    $w('#saveShiftButton').disable();
    await saveShift({
      _id: $w('#shiftIdInput').value || undefined,
      date: $w('#shiftDatePicker').value,
      shiftType: $w('#shiftTypeInput').value,
      startTime: $w('#startTimeInput').value,
      endTime: $w('#endTimeInput').value,
      assignedMemberId: $w('#assigneeDropdown').value || null,
      roleRequired: $w('#roleRequiredInput').value,
      status: $w('#statusDropdown').value,
      notes: $w('#notesInput').value,
    });
    clearShiftForm();
    await loadSchedule();
  } catch (error) {
    showError(error);
  } finally {
    $w('#saveShiftButton').enable();
  }
}

export async function approveRecord(clockRecordId) {
  try {
    await approveClockRecord(clockRecordId);
    await loadSchedule();
  } catch (error) {
    showError(error);
  }
}

function populateShiftForm(shift) {
  $w('#shiftIdInput').value = shift._id;
  $w('#shiftDatePicker').value = new Date(shift.date);
  $w('#shiftTypeInput').value = shift.shiftType || '';
  $w('#startTimeInput').value = shift.startTime || '';
  $w('#endTimeInput').value = shift.endTime || '';
  $w('#assigneeDropdown').value = shift.assignedMemberId || undefined;
  $w('#roleRequiredInput').value = shift.roleRequired || '';
  $w('#statusDropdown').value = shift.status || 'draft';
  $w('#notesInput').value = shift.notes || '';
}

function clearShiftForm() {
  $w('#shiftIdInput').value = '';
  $w('#shiftTypeInput').value = '';
  $w('#startTimeInput').value = '';
  $w('#endTimeInput').value = '';
  $w('#assigneeDropdown').value = undefined;
  $w('#roleRequiredInput').value = '';
  $w('#statusDropdown').value = 'draft';
  $w('#notesInput').value = '';
}

function staffName(memberId) {
  const profile = schedule.staff.find((staff) => staff.memberId === memberId);
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Unassigned';
}

function showError(error) {
  $w('#errorText').text = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  $w('#errorText').expand();
}
