// External dependencies.
import {
  useEffect,
  useState,
} from 'react';

// Local dependencies.
import {
  getNetworkRecorderInstalledAt,
  getNetworkRecords,
  installNetworkRecorder,
  subscribeToNetworkRecords,
  type NetworkRecord,
} from './utils/network-recorder';

export type NetworkRecordsDebug = {
  records: NetworkRecord[];
  installedAt: number | null;
};

/**
 * Installs the fetch recorder on mount and reactively exposes captured requests.
 */
export const useNetworkRecords = (): NetworkRecordsDebug => {
  const [snapshot, setSnapshot] = useState<NetworkRecordsDebug>(() => {
    installNetworkRecorder();

    return {
      records: getNetworkRecords(),
      installedAt: getNetworkRecorderInstalledAt(),
    };
  });

  useEffect(() => {
    installNetworkRecorder();

    const syncSnapshot = () => setSnapshot({
      records: getNetworkRecords(),
      installedAt: getNetworkRecorderInstalledAt(),
    });

    syncSnapshot();

    return subscribeToNetworkRecords(syncSnapshot);
  }, []);

  return snapshot;
};
