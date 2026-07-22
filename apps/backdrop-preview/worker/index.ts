import handler from "vinext/server/app-router-entry";

const worker = {
  fetch(...args: Parameters<typeof handler.fetch>): ReturnType<typeof handler.fetch> {
    return handler.fetch(...args);
  }
};

export default worker;
