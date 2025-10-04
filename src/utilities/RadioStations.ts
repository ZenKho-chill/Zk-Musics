// Interface cho radio station
interface RadioStation {
  name: string;
  url: string;
}

export const RadioStations: Record<string, RadioStation[]> = {
  iLoveMusic: [
    { name: "Chill Hops", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
    { name: "Hits History", url: "https://streams.ilovemusic.de/iloveradio1.mp3" },
    { name: "Dance History", url: "https://streams.ilovemusic.de/iloveradio26.mp3" },
    { name: "Mashup", url: "https://streams.ilovemusic.de/iloveradio5.mp3" },
    { name: "Mainstage", url: "https://streams.ilovemusic.de/iloveradio22.mp3" },
    { name: "Hardstyle", url: "https://streams.ilovemusic.de/iloveradio21.mp3" },
    { name: "Trance", url: "https://streams.ilovemusic.de/iloveradio25.mp3" },
    { name: "Hip Hop", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
    { name: "The Battle", url: "https://streams.ilovemusic.de/iloveradio7.mp3" },
    { name: "X-Mas", url: "https://streams.ilovemusic.de/iloveradio8.mp3" },
    { name: "Greatest Hits", url: "https://streams.ilovemusic.de/iloveradio2.mp3" },
    { name: "2000s", url: "https://streams.ilovemusic.de/iloveradio10.mp3" },
  ],
  Lofi: [
    { name: "Lofi Hip Hop", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
    { name: "Chill Beats", url: "https://streams.ilovemusic.de/iloveradio36.mp3" },
    { name: "Study Music", url: "https://ec3.yesstreaming.net:3755/stream" },
    { name: "Anime Lofi", url: "http://stream.laut.fm/animealive" },
    { name: "Jazz Lofi", url: "http://stream.laut.fm/lofi" },
    { name: "Panda Lounge", url: "http://stream.laut.fm/pandalounge" },
  ],
  Electronic: [
    { name: "EDM Hits", url: "http://stream.laut.fm/edm" },
    { name: "House Music", url: "https://streams.ilovemusic.de/iloveradio26.mp3" },
    { name: "Techno", url: "http://stream.laut.fm/techno" },
    { name: "Trance", url: "https://streams.ilovemusic.de/iloveradio25.mp3" },
  ],
  HipHop: [
    { name: "Hip Hop Classics", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
    { name: "Phonk", url: "http://stream.laut.fm/phonk" },
    { name: "Rap Hits", url: "http://stream.laut.fm/rap" },
    { name: "German Rap", url: "http://stream.laut.fm/deutschrap" },
  ],
  Rock: [
    { name: "Classic Rock", url: "http://stream.laut.fm/classicrock" },
    { name: "Metal", url: "http://stream.laut.fm/metal" },
  ],
  Pop: [
    { name: "Pop Hits", url: "https://streams.ilovemusic.de/iloveradio1.mp3" },
    { name: "Top 40", url: "https://streams.ilovemusic.de/iloveradio2.mp3" },
    { name: "2000s Pop", url: "https://streams.ilovemusic.de/iloveradio10.mp3" },
  ],
  Jazz: [
    { name: "Classic Jazz", url: "http://stream.laut.fm/jazz" },
  ],
  Gaming: [
    { name: "Game Music", url: "http://stream.laut.fm/gamemusic" },
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

export const RadioStationArray = (): { no: number; name: string; link: string; category: string }[] => {
  const result: { no: number; name: string; link: string; category: string }[] = [];
  const keys = Object.keys(RadioStations);
  let no = 1;

  for (const key of keys) {
    const arrayData = RadioStations[key];
    const convertedData = arrayData.map((ele) => {
      const data = { 
        no, 
        name: ele.name, 
        link: ele.url, 
        category: key
      };
      no += 1;
      return data;
    });
    result.push(...convertedData);
  }

  return result;
};
