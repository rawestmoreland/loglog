import { useQuery } from '@tanstack/react-query';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';

/**
 * Returns the total time spent on the toilet
 * @returns total time in milliseconds
 */
export function useTimeOnToilet() {
  const { pb } = usePocketBase();
  const { pooProfile } = useAuth();

  return useQuery({
    queryKey: ['time-on-toilet'],
    queryFn: async () => {
      const records = await pb?.collection('poop_seshes').getFullList<PoopSesh>({
        filter: `poo_profile = "${pooProfile?.id}" && ended != null`,
      });

      if (!records) return { formatted: '0s', millis: 0, count: 0 };

      const cities = records?.map((record) => record.location?.city);
      const uniqueCities = [...new Set(cities)];

      const totalTime = records?.reduce((acc, record) => {
        const start = new Date(record.started);
        const end = new Date(record.ended!);
        const duration = end.getTime() - start.getTime();
        return acc + duration;
      }, 0);

      const companyTime = records?.reduce((acc, record) => {
        if (record.company_time) {
          const start = new Date(record.started);
          const end = new Date(record.ended!);
          const duration = end.getTime() - start.getTime();
          return acc + duration;
        }
        return acc;
      }, 0);

      const hours = Math.floor(totalTime / (1000 * 60 * 60));
      const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((totalTime % (1000 * 60)) / 1000);

      const formattedTime = `${hours}h ${minutes}m ${seconds}s`;
      const formattedCompanyTime = `${Math.floor(companyTime / (1000 * 60 * 60))}h ${Math.floor(
        (companyTime % (1000 * 60 * 60)) / (1000 * 60)
      )}m ${Math.floor((companyTime % (1000 * 60)) / 1000)}s`;

      return {
        totalTime: formattedTime,
        companyTime: formattedCompanyTime,
        millis: totalTime,
        count: records?.length,
        cityCount: uniqueCities.length,
      };
    },
    enabled: !!pooProfile?.id,
  });
}
