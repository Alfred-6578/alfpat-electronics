const paginate = async ({ model, query = {}, page = 1, limit = 12, populate = "", sort = {} }) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query).populate(populate).sort(sort).skip(skip).limit(limit),
    model.countDocuments(query),
  ]);

  return {
    data,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

export default paginate;
