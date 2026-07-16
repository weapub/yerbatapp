/**
 * Contrato mínimo que debe cumplir un delegate de Prisma (prisma.campo, prisma.cultivo, ...)
 * para poder reutilizar las operaciones CRUD comunes desde BaseRepository.
 */
export interface PrismaDelegate<TModel, TWhere, TCreateInput, TUpdateInput> {
  findMany(args?: unknown): Promise<TModel[]>;
  findUnique(args: { where: TWhere }): Promise<TModel | null>;
  count(args?: { where?: TWhere }): Promise<number>;
  create(args: { data: TCreateInput }): Promise<TModel>;
  update(args: { where: TWhere; data: TUpdateInput }): Promise<TModel>;
  delete(args: { where: TWhere }): Promise<TModel>;
}

/**
 * Repositorio base genérico: centraliza el acceso a Prisma para operaciones CRUD
 * estándar. Los repositorios concretos extienden esta clase y agregan sus propios
 * métodos de consulta específicos (filtros, includes, agregaciones).
 */
export abstract class BaseRepository<
  TModel,
  TWhere,
  TCreateInput,
  TUpdateInput,
  TDelegate extends PrismaDelegate<TModel, TWhere, TCreateInput, TUpdateInput>,
> {
  protected constructor(protected readonly delegate: TDelegate) {}

  findById(where: TWhere): Promise<TModel | null> {
    return this.delegate.findUnique({ where });
  }

  create(data: TCreateInput): Promise<TModel> {
    return this.delegate.create({ data });
  }

  update(where: TWhere, data: TUpdateInput): Promise<TModel> {
    return this.delegate.update({ where, data });
  }

  delete(where: TWhere): Promise<TModel> {
    return this.delegate.delete({ where });
  }

  count(where?: TWhere): Promise<number> {
    return this.delegate.count({ where });
  }
}
