import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { GenresService } from './genres.service';
import {
  CreateGenreInput,
  CreateSubgenreInput,
  GenreWhereInput,
  SubgenreWhereInput,
} from './dto';

@ObjectType()
class Genre {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  link: string;
}

@ObjectType()
class Subgenre {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  link: string;

  @Field(() => Int)
  genreId: number;
}

@Resolver()
export class GenresResolver {
  constructor(private readonly genresService: GenresService) {}

  @Query(() => Genre, { nullable: true })
  async genre(@Args('where') where: GenreWhereInput) {
    return await this.genresService.genre({
      id: where.id,
      title: where.title,
    });
  }

  @Query(() => Subgenre, { nullable: true })
  async subgenre(@Args('where') where: SubgenreWhereInput) {
    return await this.genresService.subgenre({
      id: where.id,
      title: where.title,
    });
  }

  @Mutation(() => Genre)
  async createGenre(@Args('data') data: CreateGenreInput) {
    return await this.genresService.createGenre(data);
  }

  @Mutation(() => Subgenre)
  async createSubgenre(@Args('data') data: CreateSubgenreInput) {
    const dataInput = {
      title: data.title,
      link: data.link,
      Genre: { connect: { id: data.genreConnectId } },
    };
    return await this.genresService.createSubgenre(dataInput);
  }

  @Mutation(() => Genre, { nullable: true })
  async deleteGenre(@Args('where') where: GenreWhereInput) {
    return await this.genresService.deleteGenre({
      id: where.id,
      title: where.title,
    });
  }

  @Mutation(() => Subgenre, { nullable: true })
  async deleteSubgenre(@Args('where') where: SubgenreWhereInput) {
    return await this.genresService.deleteSubgenre({
      id: where.id,
      title: where.title,
    });
  }
}
