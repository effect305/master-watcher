function handleRequestLabels(robot, context) {
  robot.on("status", async context => {
    const { state, branches } = context.payload;
    // console.log(context.payload);
    // return;

    if (state === "pending") return;
    if (!branches.some(branch => branch.name === "master")) return;
    // const hasDontMergeLabel = labels.some(label => utils.isDontMerge(label.name));
    // const state = hasDontMergeLabel ? 'failure' : 'success';
    // const description = hasDontMergeLabel ? 'Do not merge!' : 'Ready for merge';

    // context.github.repos.createStatus(
    //   context.repo({
    //     state,
    //     description,
    //     sha: head.sha,
    //     target_url: process.env.APP_LINK,
    //     context: process.env.APP_NAME
    //   })
    // );
    console.log(context.github.repos);
    console.log("got webhook!");
    if (branches.some(branch => branch.name === "master")) {
      // TODO: pull requests instead
      const allBranches = await context.github.repos.getBranches(
        context.repo()
      );

      if (state === "failure") {
        console.log("Broken, gotta block merges!");
      } else {
        console.log("all good!");
        // console.log(branches);
        // console.log(branches.data);
      }

      const stateToPost = state === "failure" ? "failure" : "success";
      const descriptionToPost =
        state === "failure" ? "Master is red." : "Master is green.";

      allBranches.data.map(branch => {
        if (branch.name === "master") return;

        context.github.repos.createStatus(
          context.repo({
            state: stateToPost,
            description: descriptionToPost,
            sha: branch.commit.sha,
            target_url: process.env.APP_LINK,
            context: process.env.APP_NAME
          })
        );
      });
    }
  });

  robot.on(
    ["pull_request.labeled", "pull_request.unlabeled"],
    async context => {
      const { action, label, pull_request, name } = context.payload;

      if (label.name !== "master-fix") return;

      console.log(`${action} master-fix`);

      // --------

      // console.log(context.github);
      // console.log(context.github.repos);
      // const allBranches = await context.github.pullRequests.getAll(
      //   context.repo({
      //     state: "open",
      //     per_page: 2,
      //     page: 10
      //   })
      // );
      // console.log(allBranches);

      // --------

      if (action === "labeled") {
        context.github.repos.createStatus(
          context.repo({
            state: "success",
            description: "Masterfix is always mergeable",
            sha: pull_request.head.sha,
            target_url: process.env.APP_LINK,
            context: process.env.APP_NAME
          })
        );
      } else {
        const {
          data: combinedStatus
        } = await context.github.repos.getCombinedStatusForRef(
          context.repo({
            ref: "master"
          })
        );

        console.log(combinedStatus);

        context.github.repos.createStatus(
          context.repo({
            state: combinedStatus.state === "success" ? "success" : "failure",
            description:
              combinedStatus.state === "success"
                ? "Master is green."
                : "Master is red.",
            sha: pull_request.head.sha,
            target_url: `https://github.com/${name}/commits/master`,
            context: process.env.APP_NAME
          })
        );
      }
    }
  );
}

module.exports = handleRequestLabels;
