export const RadioStations = {
  iLoveMusic: [
    {
      name: "Hip-Hop",
      url: "https://ilm.stream18.radiohost.de/ilm_hiphop-2023-jahrescharts_mp3-192",
    },
    { name: "Hits History", url: "https://ilm-stream13.radiohost.de/ilm_ilovehitshistory_mp3-192" },
    { name: "Dance History", url: "https://streams.ilovemusic.de/iloveradio26.mp3" },
    { name: "Mushup", url: "https://streams.ilovemusic.de/iloveradio5.mp3" },
    { name: "Mainstage", url: "https://streams.ilovemusic.de/iloveradio22.mp3" },
    { name: "Hardstyle", url: "https://streams.ilovemusic.de/iloveradio21.mp3" },
    { name: "E D M", url: "http://stream.laut.fm/edm" },
    { name: "Phonk", url: "http://stream.laut.fm/phonk" },
    { name: "Chillout, Relax & Study", url: "https://ec3.yesstreaming.net:3755/stream" },
  ],
  Lofi: [
    { name: "Anime Live", url: "http://stream.laut.fm/animealive" },
    { name: "Lofi Relax", url: "http://stream.laut.fm/lofi" },
    { name: "Panda Lounge", url: "http://stream.laut.fm/pandalounge" },
    { name: "ChillOut Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
  ],
  ReyFM: [
    { name: "Original", url: "https://reyfm.stream37.radiohost.de/reyfm-original_mp3-320" },
    { name: "Chill Out", url: "https://reyfm-stream16.radiohost.de/reyfm-chill_mp3-320" },
    { name: "Lofi", url: "https://reyfm-stream17.radiohost.de/reyfm-lofi_mp3-320" },
    { name: "Hits", url: "https://reyfm-stream15.radiohost.de/reyfm-hits_mp3-320" },
  ],
};

export const RadioStationNewInterface = (): Record<
  string,
  { no: number; name: string; link: string }[]
> => {
  const result: Record<string, { no: number; name: string; link: string }[]> = {};
  const keys = Object.keys(RadioStations);
  let no = 1;

  for (const key of keys) {
    const arrayData = RadioStations[key];
    const convertedData = arrayData.map((ele) => {
      const data = { no, name: ele.name, link: ele.url };
      no += 1;
      return data;
    });
    result[key] = convertedData;
  }

  return result;
};

export const RadioStationArray = (): { no: number; name: string; link: string }[] => {
  const result: { no: number; name: string; link: string }[] = [];
  const keys = Object.keys(RadioStations);
  let no = 1;

  for (const key of keys) {
    const arrayData = RadioStations[key];
    const convertedData = arrayData.map((ele) => {
      const data = { no, name: ele.name, link: ele.url };
      no += 1;
      return data;
    });
    result.push(...convertedData);
  }

  return result;
};
