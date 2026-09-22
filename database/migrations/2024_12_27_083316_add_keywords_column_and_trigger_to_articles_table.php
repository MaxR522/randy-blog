<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add the keywords column
        Schema::table('articles', function (Blueprint $table) {
            $table->text('keywords')->nullable()->after('raw_content');
        });

        // Create the trigger function to update the keywords column
        DB::statement("
            CREATE OR REPLACE FUNCTION update_keywords() RETURNS trigger AS $$
            BEGIN
                WITH tokenized_words AS (
                    SELECT
                        unnest(string_to_array(lower(regexp_replace(NEW.raw_content, '[,.<>?«»!:()]+', '', 'gi')), ' ')) AS word
                ),
                filtered_words AS (
                    SELECT
                        word
                    FROM tokenized_words
                    WHERE word NOT IN (
                        'a', 'abord', 'absolument', 'afin', 'ah', 'ai', 'aie', 'aient', 
                        'aies', 'ailleurs', 'ainsi', 'ait', 'allaient', 'allo', 'allons', 
                        'allô', 'alors', 'anterieur', 'anterieure', 'anterieures', 'apres', 
                        'après', 'as', 'assez', 'attendu', 'au', 'aucun', 'aucune', 'aucuns', 
                        'aujourd', 'aupres', 'auquel', 'aura', 'aurai', 'auraient', 
                        'aurais', 'aurait', 'auras', 'aurez', 'auriez', 'aurions', 'aurons', 'auront', 
                        'aussi', 'autant', 'autre', 'autrefois', 'autrement', 'autres', 'autrui', 'aux', 
                        'auxquelles', 'auxquels', 'avaient', 'avais', 'avait', 'avant', 'avec', 'avez', 
                        'aviez', 'avions', 'avoir', 'avons', 'ayant', 'ayez', 'ayons', 'b', 'bah', 'bas', 
                        'basee', 'bat', 'beau', 'beaucoup', 'bien', 'bigre', 'bon', 'boum', 'bravo', 'brrr', 
                        'c', 'car', 'ce', 'ceci', 'cela', 'celle', 'celle-ci', 'celle-là', 'celles', 'celles-ci', 
                        'celles-là', 'celui', 'celui-ci', 'celui-là', 'celà', 'cent', 'cependant', 'certain', 
                        'certaine', 'certaines', 'certains', 'certes', 'ces', 'cet', 'cette', 'ceux', 'ceux-ci', 
                        'ceux-là', 'chacun', 'chacune', 'chaque', 'cher', 'chers', 'chez', 'chiche', 'chut', 
                        'chère', 'chères', 'ci', 'cinq', 'cinquantaine', 'cinquante', 'cinquantième', 'cinquième', 
                        'clac', 'clic', 'combien', 'comme', 'comment', 'comparable', 'comparables', 'compris', 
                        'concernant', 'contre', 'couic', 'crac', 'd', 'da', 'dans', 'de', 'debout', 'dedans', 'dehors', 
                        'deja', 'delà', 'depuis', 'dernier', 'derniere', 'derriere', 'derrière', 'des', 'desormais', 
                        'desquelles', 'desquels', 'dessous', 'dessus', 'deux', 'deuxième', 'deuxièmement', 'devant', 
                        'devers', 'devra', 'devrait', 'different', 'differentes', 'differents', 'différent', 'différente', 
                        'différentes', 'différents', 'dire', 'directe', 'directement', 'dit', 'dite', 'dits', 'divers', 
                        'diverse', 'diverses', 'dix', 'dix-huit', 'dix-neuf', 'dix-sept', 'dixième', 'doit', 'doivent', 
                        'donc', 'dont', 'dos', 'douze', 'douzième', 'dring', 'droite', 'du', 'duquel', 'durant', 'dès', 
                        'début', 'désormais', 'e', 'effet', 'egale', 'egalement', 'egales', 'eh', 'elle', 'elle-même', 
                        'elles', 'elles-mêmes', 'en', 'encore', 'enfin', 'entre', 'envers', 'environ', 'es', 'essai', 'est', 
                        'et', 'etant', 'etc', 'etre', 'eu', 'eue', 'eues', 'euh', 'eurent', 'eus', 'eusse', 'eussent', 
                        'eusses', 'eussiez', 'eussions', 'eut', 'eux', 'eux-mêmes', 'exactement', 'excepté', 'extenso', 
                        'exterieur', 'eûmes', 'eût', 'eûtes', 'f', 'fais', 'faisaient', 'faisant', 'fait', 'faites', 'façon', 
                        'feront', 'fi', 'flac', 'floc', 'fois', 'font', 'force', 'furent', 'fus', 'fusse', 'fussent', 'fusses', 
                        'fussiez', 'fussions', 'fut', 'fûmes', 'fût', 'fûtes', 'g', 'gens', 'h', 'ha', 'haut', 'hein', 'hem', 
                        'hep', 'hi', 'ho', 'holà', 'hop', 'hormis', 'hors', 'hou', 'houp', 'hue', 'hui', 'huit', 'huitième', 
                        'hum', 'hurrah', 'hé', 'hélas', 'i', 'ici', 'il', 'ils', 'importe', 'j', 'je', 'jusqu', 'jusque', 'juste', 
                        'k', 'l', 'la', 'laisser', 'laquelle', 'las', 'le', 'lequel', 'les', 'lesquelles', 'lesquels', 'leur', 
                        'leurs', 'longtemps', 'lors', 'lorsque', 'lui', 'lui-meme', 'lui-même', 'là', 'lès', 'm', 'ma', 'maint', 
                        'maintenant', 'mais', 'malgre', 'malgré', 'maximale', 'me', 'meme', 'memes', 'merci', 'mes', 'mien', 
                        'mienne', 'miennes', 'miens', 'mille', 'mince', 'mine', 'minimale', 'moi', 'moi-meme', 'moi-même', 
                        'moindres', 'moins', 'mon', 'mot', 'moyennant', 'multiple', 'multiples', 'même', 'mêmes', 'n', 'na', 
                        'naturel', 'naturelle', 'naturelles', 'ne', 'neanmoins', 'necessaire', 'necessairement', 'neuf', 
                        'neuvième', 'ni', 'nombreuses', 'nombreux', 'nommés', 'non', 'nos', 'notamment', 'notre', 'nous', 
                        'nous-mêmes', 'nouveau', 'nouveaux', 'nul', 'néanmoins', 'nôtre', 'nôtres', 'o', 'oh', 'ohé', 'ollé', 
                        'olé', 'on', 'ont', 'onze', 'onzième', 'ore', 'ou', 'ouf', 'ouias', 'oust', 'ouste', 'outre', 'ouvert', 
                        'ouverte', 'ouverts', 'o|', 'où', 'p', 'paf', 'pan', 'par', 'parce', 'parfois', 'parle', 'parlent', 
                        'parler', 'parmi', 'parole', 'parseme', 'partant', 'particulier', 'particulière', 'particulièrement', 
                        'pas', 'passé', 'pendant', 'pense', 'permet', 'personne', 'personnes', 'peu', 'peut', 'peuvent', 
                        'peux', 'pff', 'pfft', 'pfut', 'pif', 'pire', 'pièce', 'plein', 'plouf', 'plupart', 'plus', 'plusieurs', 
                        'plutôt', 'possessif', 'possessifs', 'possible', 'possibles', 'pouah', 'pour', 'pourquoi', 'pourrais', 
                        'pourrait', 'pouvait', 'prealable', 'precisement', 'premier', 'première', 'premièrement', 'pres', 
                        'probable', 'probante', 'procedant', 'proche', 'près', 'psitt', 'pu', 'puis', 'puisque', 'pur', 'pure', 
                        'q', 'qu', 'quand', 'quant', 'quant-à-soi', 'quanta', 'quarante', 'quatorze', 'quatre', 'quatre-vingt', 
                        'quatrième', 'quatrièmement', 'que', 'quel', 'quelconque', 'quelle', 'quelles', 'quelque', 
                        'quelques', 'quels', 'qui', 'quiconque', 'quinze', 'quoi', 'quoique', 'r', 'rare', 'rarement', 'rares', 
                        'relative', 'relativement', 'remarquable', 'rend', 'rendre', 'restant', 'reste', 'restent', 'restrictif', 
                        'retour', 'revoici', 'revoilà', 'rien', 's', 'sa', 'sacrebleu', 'sait', 'sans', 'sapristi', 'sauf', 'se', 'ses',
                        'second', 'seconde', 'secondes', 'seemingly', 'selon', 'semblant', 'si', 'sien', 'sienne', 'siennes', 
                        'siens', 'sinon', 'siècle', 'sième', 'soi', 'soi-même', 'soient', 'soi-même', 'soit', 'soixante', 
                        'soleil', 'sommes', 'son', 'sont', 'souhaite', 'souhaiter', 'souhaité', 'sous', 'souvent', 'souviens', 
                        'soyez', 'su', 'suite', 'sur', 'sursis', 'sus', 't', 'tâche', 'tandis', 'tant', 'tel', 'telle', 'telles', 
                        'tels', 'tenant', 'tendrement', 'te', 'tellement', 'tels', 'terrible', 'tes', 'tout', 'tous', 'très', 
                        'triple', 'trop', 'troublant', 'très', 'téléphone', 'très', 'un', 'une', 'c’est', 'c''est', 'à', 'en', 'et',
                        'le', 'la', 'les', 'des', 'du', 'de', 'dans', 'sur', 'pour', 'par', 'avec', 'ce', 'cette', 'ces',
                        'il', 'elle', 'ils', 'elles', 'nous', 'vous', 'moi', 'toi', 'qui', 'que', 'quoi', 'où', 'comment', 'pourquoi',
                        'aujourd''hui', 'aujourd’hui', 'd’une', 'd''une', 'y', 'n’est', 'n''est', 'n’y', 'n''y', 'd’être', 'd''être',
                        'qu’ils', 'qu''ils', 'd’un', 'd''un', 'ici', 'l’on', 'l''on', 'va', 'été', 'jusqu’à', 'j’ai',
                        'jusqu''à', 'j''ai', 'j’étais', 'j''étais', 'suis', 'qu’on', 'qu''on'
                    )
                ),
                word_frequencies AS (
                    SELECT
                        word,
                        COUNT(*) AS frequency
                    FROM filtered_words
                    GROUP BY word
                    ORDER BY frequency DESC
                    LIMIT 10
                )
                SELECT string_agg(word, ', ') INTO NEW.keywords
                FROM word_frequencies;

                RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
        ");

        // Create the trigger to call the function on insert and update
        DB::statement('
            CREATE TRIGGER trigger_update_keywords
            BEFORE INSERT OR UPDATE ON articles
            FOR EACH ROW EXECUTE FUNCTION update_keywords();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the trigger
        DB::statement('DROP TRIGGER IF EXISTS trigger_update_keywords ON articles');

        // Drop the trigger function
        DB::statement('DROP FUNCTION IF EXISTS update_keywords()');

        // Drop the keywords column
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('keywords');
        });
    }
};
