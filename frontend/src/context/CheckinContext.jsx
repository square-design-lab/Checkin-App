import { createContext, useContext, useState, useCallback } from 'react';

const CheckinContext = createContext(null);

const LOCATION_NAMES = { '1': 'Stillwater', '5': 'St. Anthony', '8': 'Edina' };

export function CheckinProvider({ children }) {
  const [dept, setDept] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [patient, setPatient] = useState(null);         // { patientId, firstName, lastName }
  const [appointments, setAppointments] = useState([]); // array from /api/checkin/appointments
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const initDept = useCallback((deptId) => {
    setDept(deptId);
    setLocationName(LOCATION_NAMES[String(deptId)] || 'Clinic');
  }, []);

  const resetSession = useCallback(() => {
    setPatient(null);
    setAppointments([]);
    setSelectedAppointment(null);
  }, []);

  return (
    <CheckinContext.Provider
      value={{
        dept,
        locationName,
        initDept,
        patient,
        setPatient,
        appointments,
        setAppointments,
        selectedAppointment,
        setSelectedAppointment,
        resetSession,
      }}
    >
      {children}
    </CheckinContext.Provider>
  );
}

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) throw new Error('useCheckin must be used inside CheckinProvider');
  return ctx;
}
